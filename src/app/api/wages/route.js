import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

// GET /api/wages - Calculate and retrieve wages for staff
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const monthParam = searchParams.get('month'); // 1 - 12
    const yearParam = searchParams.get('year') || '2026';

    const isUserManager = isManager(currentUser);

    // Determine target user IDs
    let targetUserIds = [];
    if (!isUserManager) {
      // Non-managers can ONLY access their own wages
      targetUserIds = [currentUser.id];
    } else if (requestedUserId && requestedUserId !== 'ALL') {
      targetUserIds = [parseInt(requestedUserId, 10)];
    }

    // Determine date range
    const y = parseInt(yearParam, 10);
    let startDate, endDate;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (monthParam && monthParam !== 'ALL') {
      const m = parseInt(monthParam, 10) - 1;
      startDate = new Date(Date.UTC(y, m, 1));
      endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    } else {
      // Default to current month or full year
      startDate = new Date(Date.UTC(y, 0, 1));
      endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    }

    // Query users
    const userWhere = { status: 'CURRENT' };
    if (targetUserIds.length > 0) {
      userWhere.id = { in: targetUserIds };
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        rateOfPay: true,
        contractedHours: true,
        sleepingNights: true,
        costForSleepingNights: true,
        salary: true,
        role: {
          select: { name: true, displayName: true }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    // For each user, compute timesheet from ClockInOut and Manual Entries
    const wageSheets = await Promise.all(
      users.map(async (u) => {
        const defaultRate = parseFloat(u.rateOfPay) || 12.50;
        const defaultNightRate = parseFloat(u.costForSleepingNights) || 45.00;

        // 1. Fetch Clock-in-outs (Live mobile & terminal attendance records)
        const clockRecords = await prisma.clockInOut.findMany({
          where: {
            userId: u.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            shiftAssignment: {
              include: {
                shift: {
                  include: {
                    shiftType: true
                  }
                }
              }
            },
            serviceSeeker: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { date: 'desc' }
        });

        // 2. Fetch Rota Shift Assignments (Scheduled & attended rota hours)
        const rotaAssignments = await prisma.shiftAssignment.findMany({
          where: {
            userId: u.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            shift: {
              include: {
                shiftType: true,
                serviceSeeker: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            clockInOuts: true
          },
          orderBy: { date: 'desc' }
        });

        // 3. Fetch Manual Entries
        const manualEntries = await prisma.wageManualEntry.findMany({
          where: {
            userId: u.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { date: 'desc' }
        });

        // 4. Fetch Amendment Requests
        const amendmentRequests = await prisma.wageAmendmentRequest.findMany({
          where: {
            userId: u.id,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // 5. Calculate hours combining Clock-In attendance & Rota shifts
        let regularHours = 0;
        let standbyHours = 0;
        let sleepingNightShifts = 0;

        const clockAssignmentIds = new Set();
        const detailedShifts = [];

        // Process live clock-in attendance
        clockRecords.forEach((cr) => {
          if (cr.shiftAssignmentId) clockAssignmentIds.add(cr.shiftAssignmentId);

          let durationHours = 0;
          if (cr.clockInTime && cr.clockOutTime) {
            const diffMs = new Date(cr.clockOutTime).getTime() - new Date(cr.clockInTime).getTime();
            durationHours = Math.max(0, diffMs / (1000 * 60 * 60));
          } else if (cr.shiftAssignment?.shift) {
            const s = cr.shiftAssignment.shift;
            if (s.startTime && s.endTime) {
              const [sH, sM] = s.startTime.split(':').map(Number);
              const [eH, eM] = s.endTime.split(':').map(Number);
              let diff = (eH + eM / 60) - (sH + sM / 60);
              if (diff < 0) diff += 24;
              durationHours = diff;
            }
          }

          durationHours = Math.round(durationHours * 100) / 100;
          const isStandby = cr.workType === 'STANDBY';
          const isNight = Boolean(u.sleepingNights && (cr.shiftAssignment?.shift?.isSleepIn || cr.shiftAssignment?.shift?.shiftType?.name?.toLowerCase().includes('sleep') || durationHours >= 8));

          if (isNight) sleepingNightShifts += 1;
          if (isStandby) {
            standbyHours += durationHours;
          } else {
            regularHours += durationHours;
          }

          detailedShifts.push({
            id: `clock-${cr.id}`,
            date: cr.date,
            clockInTime: cr.clockInTime,
            clockOutTime: cr.clockOutTime,
            workType: cr.workType || 'REGULAR',
            durationHours,
            isLate: cr.isLate,
            isEarly: cr.isEarly,
            source: 'CLOCK_IN',
            serviceUser: cr.serviceSeeker ? `${cr.serviceSeeker.firstName} ${cr.serviceSeeker.lastName}` : null,
            notes: cr.notes
          });
        });

        // Process scheduled Rota shifts that don't have separate clock-in records
        rotaAssignments.forEach((ra) => {
          if (clockAssignmentIds.has(ra.id) || (ra.clockInOuts && ra.clockInOuts.length > 0)) {
            return; // Already accounted for in live clock records
          }

          let durationHours = 0;
          const s = ra.shift;
          if (s?.startTime && s?.endTime) {
            const [sH, sM] = s.startTime.split(':').map(Number);
            const [eH, eM] = s.endTime.split(':').map(Number);
            let diff = (eH + eM / 60) - (sH + sM / 60);
            if (diff < 0) diff += 24;
            durationHours = diff;
          } else {
            durationHours = 7.5; // Standard rota shift default
          }

          durationHours = Math.round(durationHours * 100) / 100;
          const shiftTypeName = s?.shiftType?.name || 'REGULAR';
          const isNight = Boolean(u.sleepingNights && (shiftTypeName.toLowerCase().includes('sleep') || shiftTypeName.toLowerCase().includes('night') || durationHours >= 8));
          const isStandby = shiftTypeName.toLowerCase().includes('standby');

          if (isNight) sleepingNightShifts += 1;
          if (isStandby) {
            standbyHours += durationHours;
          } else {
            regularHours += durationHours;
          }

          detailedShifts.push({
            id: `rota-${ra.id}`,
            date: ra.date,
            clockInTime: s?.startTime || null,
            clockOutTime: s?.endTime || null,
            workType: isNight ? 'SLEEP_IN' : (isStandby ? 'STANDBY' : 'ROTA_SHIFT'),
            durationHours,
            isLate: false,
            isEarly: false,
            source: 'ROTA_SCHEDULED',
            serviceUser: s?.serviceSeeker ? `${s.serviceSeeker.firstName} ${s.serviceSeeker.lastName}` : 'Scheduled Rota Duty',
            notes: s?.shiftType?.name ? `Rota Shift (${s.shiftType.name})` : 'Rota Shift'
          });
        });

        // Sort combined shifts chronologically descending
        detailedShifts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Sum manual adjustments
        let manualAdjustmentsTotal = 0;
        manualEntries.forEach((me) => {
          if (me.entryType === 'DEDUCTION') {
            manualAdjustmentsTotal -= me.amount;
          } else {
            manualAdjustmentsTotal += me.amount;
          }
        });

        const regularPay = regularHours * defaultRate;
        const standbyPay = standbyHours * (defaultRate * 0.5);
        const sleepingNightPay = sleepingNightShifts * defaultNightRate;
        const grossPay = regularPay + standbyPay + sleepingNightPay + manualAdjustmentsTotal;

        return {
          user: {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            name: `${u.firstName} ${u.lastName}`.trim(),
            employeeNumber: u.employeeNumber || `EMP-${u.id}`,
            role: u.role?.displayName || u.role?.name || 'Staff',
            rateOfPay: defaultRate,
            contractedHours: u.contractedHours || 0,
            costForSleepingNights: defaultNightRate,
          },
          summary: {
            totalHours: Math.round((regularHours + standbyHours) * 100) / 100,
            regularHours: Math.round(regularHours * 100) / 100,
            standbyHours: Math.round(standbyHours * 100) / 100,
            sleepingNightShifts,
            regularPay: Math.round(regularPay * 100) / 100,
            standbyPay: Math.round(standbyPay * 100) / 100,
            sleepingNightPay: Math.round(sleepingNightPay * 100) / 100,
            manualAdjustmentsTotal: Math.round(manualAdjustmentsTotal * 100) / 100,
            grossPay: Math.max(0, Math.round(grossPay * 100) / 100),
            periodStart: startDate.toISOString().split('T')[0],
            periodEnd: endDate.toISOString().split('T')[0],
          },
          detailedShifts,
          manualEntries,
          amendmentRequests
        };
      })
    );

    return NextResponse.json({
      success: true,
      isUserManager,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      wageSheets
    });

  } catch (error) {
    console.error('Error calculating wages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
