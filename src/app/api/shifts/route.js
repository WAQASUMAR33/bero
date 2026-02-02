'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildShiftAssignmentData } from '@/lib/shiftScheduling';
import jwt from 'jsonwebtoken';
// GET /api/shifts
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'all' | 'my'
    const date = searchParams.get('date'); // ISO date string
    const week = searchParams.get('week'); // ISO date string for week start

    let whereClause = {
      AND: []
    };

    // If view is 'my', only show shifts assigned to the current user
    if (view === 'my') {
      whereClause.AND.push({
        assignments: {
          some: {
            userId: decoded.userId
          }
        }
      });
    }

    // Filter by date range if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.AND.push({
        fromDate: {
          lte: endOfDay
        }
      });
      whereClause.AND.push({
        OR: [
          { untilDate: null },
          { untilDate: { gte: startOfDay } }
        ]
      });
    }

    if (week) {
      const startOfWeek = new Date(week);
      const endOfWeek = new Date(week);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      whereClause.AND.push({
        fromDate: {
          lte: endOfWeek
        }
      });
      whereClause.AND.push({
        OR: [
          { untilDate: null },
          { untilDate: { gte: startOfWeek } }
        ]
      });
    }

    // If no filters, remove the empty AND array
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true, address: true, latitude: true, longitude: true }
        },
        shiftType: true,
        funder: {
          select: { id: true, fundingSource: true, contractNumber: true }
        },
        shiftRun: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      },
      orderBy: { fromDate: 'asc' }
    });

    // If view is 'my', enhance with clock in/out status and shift assignment IDs
    if (view === 'my') {
      // Get clock in/out records for this user for the date range
      const dateFilter = date || week;
      let clockInOutWhere = {
        userId: decoded.userId
      };

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        clockInOutWhere.date = {
          gte: startOfDay,
          lte: endOfDay
        };
      } else if (week) {
        const startOfWeek = new Date(week);
        const endOfWeek = new Date(week);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        clockInOutWhere.date = {
          gte: startOfWeek,
          lte: endOfWeek
        };
      }

      const clockInOuts = await prisma.clockInOut.findMany({
        where: clockInOutWhere,
        select: {
          id: true,
          shiftAssignmentId: true,
          date: true,
          clockInTime: true,
          clockOutTime: true,
          isLate: true,
          isEarly: true
        }
      });

      // Map clock in/out by shift assignment ID and date
      const clockInOutMap = {};
      clockInOuts.forEach(cio => {
        if (cio.shiftAssignmentId) {
          const key = `${cio.shiftAssignmentId}_${cio.date.toISOString().split('T')[0]}`;
          clockInOutMap[key] = cio;
        }
      });

      // Enhance shifts with clock in/out status
      const enhancedShifts = shifts.map(shift => {
        // Find the assignment for this user
        const userAssignment = shift.assignments.find(a => a.userId === decoded.userId);

        if (userAssignment) {
          const assignmentDate = new Date(userAssignment.date);
          const dateKey = `${userAssignment.id}_${assignmentDate.toISOString().split('T')[0]}`;
          const clockInOut = clockInOutMap[dateKey];

          return {
            ...shift,
            shiftAssignmentId: userAssignment.id,
            assignmentDate: userAssignment.date,
            assignmentStatus: userAssignment.status,
            clockedIn: !!clockInOut,
            clockInTime: clockInOut?.clockInTime || null,
            clockOutTime: clockInOut?.clockOutTime || null,
            isLate: clockInOut?.isLate || false,
            isEarly: clockInOut?.isEarly || false,
            clockInOutId: clockInOut?.id || null
          };
        }

        return shift;
      });

      return NextResponse.json(enhancedShifts);
    }

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('GET /shifts error:', error);

    // Handle database connection errors
    const message = (error && (error.message || '')).toString();

    // MySQL connection / resource limits
    if (message.includes('max_connections_per_hour') || message.includes('ERROR 42000 (1226)')) {
      return NextResponse.json(
        {
          error: 'Database connection limit reached. Please try again in a few minutes.',
          details: 'The database user has exceeded the allowed number of connections per hour.',
        },
        { status: 503 }
      );
    }

    // Database unavailable
    if (message.includes("Can't reach database server") || error.code === 'P1001') {
      return NextResponse.json(
        {
          error: 'Database unavailable. Please check your database connection.',
          details: 'Cannot reach database server at ' + (process.env.DATABASE_URL?.match(/@([^:]+):/)?.[1] || 'database server'),
          code: 'P1001'
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch shifts', details: error.message }, { status: 500 });
  }
}

// POST /api/shifts
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const {
      serviceSeekerId,
      fromDate,
      untilDate,
      recurrence,
      startTime,
      endTime,
      shiftTypeId,
      totalStaffRequired,
      funderId,
      timeCritical,
      shiftRunId,
      notesForCarers,
      notesForManager,
      assignedUserIds
    } = body;

    if (!serviceSeekerId || !fromDate || !recurrence || !startTime || !endTime || !shiftTypeId) {
      return NextResponse.json({
        error: 'serviceSeekerId, fromDate, recurrence, startTime, endTime, and shiftTypeId are required'
      }, { status: 400 });
    }

    const parsedTotalStaff = totalStaffRequired ? parseInt(totalStaffRequired, 10) : 1;

    const shift = await prisma.shift.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        fromDate: new Date(fromDate),
        untilDate: untilDate ? new Date(untilDate) : null,
        recurrence,
        startTime,
        endTime,
        shiftTypeId: parseInt(shiftTypeId),
        totalStaffRequired: Number.isNaN(parsedTotalStaff) ? 1 : parsedTotalStaff,
        funderId: funderId ? parseInt(funderId) : null,
        timeCritical: timeCritical || false,
        shiftRunId: shiftRunId ? parseInt(shiftRunId) : null,
        notesForCarers: notesForCarers || null,
        notesForManager: notesForManager || null,
        createdById: decoded.userId,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        },
        shiftType: true,
        funder: {
          select: { id: true, fundingSource: true, contractNumber: true }
        },
        shiftRun: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      }
    });

    const uniqueAssignedUserIds = Array.isArray(assignedUserIds)
      ? [...new Set(assignedUserIds.map((value) => parseInt(value, 10)).filter((value) => Number.isInteger(value)))]
      : [];

    if (uniqueAssignedUserIds.length > 0) {
      const assignmentData = buildShiftAssignmentData({
        shiftId: shift.id,
        userIds: uniqueAssignedUserIds,
        fromDate,
        untilDate,
        recurrence,
      });

      if (assignmentData.length > 0) {
        await prisma.shiftAssignment.createMany({ data: assignmentData, skipDuplicates: true });
      }
    }

    const shiftWithAssignments = await prisma.shift.findUnique({
      where: { id: shift.id },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        },
        shiftType: true,
        funder: {
          select: { id: true, fundingSource: true, contractNumber: true }
        },
        shiftRun: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      }
    });

    // Notify assigned care workers about their new shift (OPTIMIZED)
    if (uniqueAssignedUserIds.length > 0 && uniqueAssignedUserIds.length <= 50 && shiftWithAssignments) {
      try {
        const serviceSeekerName = shiftWithAssignments.serviceSeeker?.preferredName ||
          `${shiftWithAssignments.serviceSeeker?.firstName} ${shiftWithAssignments.serviceSeeker?.lastName}`;
        const shiftDate = new Date(fromDate).toLocaleDateString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short'
        });

        await prisma.notification.createMany({
          data: uniqueAssignedUserIds.map(userId => ({
            userId: userId,
            title: 'New Shift Assigned',
            message: `You have been assigned to a shift for ${serviceSeekerName} on ${shiftDate} (${startTime} - ${endTime}).`,
            type: 'INFO',
            link: '/care-worker/rota',
            isRead: false
          })),
          skipDuplicates: true
        });
      } catch (notifError) {
        console.error('Failed to create shift assignment notifications:', notifError);
      }
    }

    return NextResponse.json(shiftWithAssignments ?? shift, { status: 201 });
  } catch (error) {
    console.error('POST /shifts error:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}

