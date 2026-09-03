import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/stats - Fetch dashboard statistics
// OPTIMIZED: Uses parallel queries and caching-friendly structure
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get start and end of current week (Monday to Sunday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // OPTIMIZATION: Run all independent queries in parallel
    const [
      // Simple counts (fast)
      lateClockInsToday,
      staffCount,
      serviceUserCount,
      policyReviews,
      marReviews,
      // Shifts for unassigned calculation
      shiftsInNext30Days,
      // Birthdays - only fetch date, limited fields
      birthdayCandidates,
      // Shift assignments for rota hours
      shiftAssignmentsThisWeek,
      // Task counts (batch all task tables)
      ...taskCounts
    ] = await Promise.all([
      // Fast counts
      prisma.clockInOut.count({
        where: { date: { gte: today, lte: endOfToday }, isLate: true }
      }),
      prisma.user.count({ where: { status: 'CURRENT' } }),
      prisma.serviceSeeker.count({ where: { status: { notIn: ['ARCHIVED', 'ARCHIVED_PRE_ADMISSION'] } } }),
      prisma.policyReview.count().catch(() => 0),
      prisma.serviceSeekerMarReview.count().catch(() => 0),

      // Shifts with assignments (limited)
      prisma.shift.findMany({
        where: {
          fromDate: { lte: next30Days },
          OR: [{ untilDate: null }, { untilDate: { gte: today } }]
        },
        select: {
          id: true,
          fromDate: true,
          untilDate: true,
          totalStaffRequired: true,
          assignments: {
            where: { date: { gte: today, lte: next30Days } },
            select: { date: true }
          }
        },
        take: 500 // Limit to prevent memory issues
      }),

      // Birthdays - minimal fields
      prisma.serviceSeeker.findMany({
        where: {
          dateOfBirth: { not: null },
          status: { notIn: ['ARCHIVED', 'ARCHIVED_PRE_ADMISSION'] }
        },
        select: { dateOfBirth: true },
        take: 1000
      }),

      // Rota hours
      prisma.shiftAssignment.findMany({
        where: { date: { gte: startOfWeek, lte: endOfWeek } },
        select: { shift: { select: { startTime: true, endTime: true } } },
        take: 500
      }),

      // All task counts in parallel
      prisma.bathingTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.bloodTestTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.bloodPressureTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.comfortCheckTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.foodDrinkTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.houseKeepingTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.muacTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.oralCareTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.oxygenTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.personCentredTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.pulseTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.repositionTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.temperatureTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.weightTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.encouragementTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }).catch(() => 0),
      prisma.followUpTask.count({ where: { date: { lte: yesterday }, status: { not: 'COMPLETED' } } }).catch(() => 0)
    ]);

    // Calculate overdue tasks from parallel results
    const overdueTasks = taskCounts.reduce((sum, count) => sum + (count || 0), 0);

    // Calculate unassigned shifts (in memory - already fetched)
    let unassignedShifts = 0;
    shiftsInNext30Days.forEach(shift => {
      const datesNeedingStaff = new Set();
      const currentDate = new Date(Math.max(today.getTime(), new Date(shift.fromDate).getTime()));
      const endDate = shift.untilDate
        ? new Date(Math.min(new Date(shift.untilDate).getTime(), next30Days.getTime()))
        : next30Days;

      while (currentDate <= endDate) {
        datesNeedingStaff.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const assignmentsByDate = {};
      shift.assignments.forEach(assignment => {
        const dateKey = new Date(assignment.date).toISOString().split('T')[0];
        assignmentsByDate[dateKey] = (assignmentsByDate[dateKey] || 0) + 1;
      });

      datesNeedingStaff.forEach(dateKey => {
        const assigned = assignmentsByDate[dateKey] || 0;
        if (assigned < shift.totalStaffRequired) {
          unassignedShifts++;
        }
      });
    });

    // Calculate birthdays (in memory)
    const birthdaysCount = birthdayCandidates.filter(seeker => {
      if (!seeker.dateOfBirth) return false;
      const birthDate = new Date(seeker.dateOfBirth);
      return birthDate.getMonth() + 1 === currentMonth && birthDate.getDate() === currentDay;
    }).length;

    // Calculate rota hours (in memory)
    let rotaHours = 0;
    shiftAssignmentsThisWeek.forEach(assignment => {
      if (!assignment.shift?.startTime || !assignment.shift?.endTime) return;
      const startTime = assignment.shift.startTime.split(':');
      const endTime = assignment.shift.endTime.split(':');
      const startHours = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
      const endHours = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
      let duration = endHours - startHours;
      if (duration < 0) duration += 24;
      rotaHours += duration;
    });

    return NextResponse.json({
      success: true,
      data: {
        unassignedShifts,
        lateClockInsToday,
        overdueTasks,
        birthdays: birthdaysCount,
        reviews: (policyReviews || 0) + (marReviews || 0),
        rotaHours: Math.round(rotaHours),
        staff: staffCount,
        serviceUsers: serviceUserCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
