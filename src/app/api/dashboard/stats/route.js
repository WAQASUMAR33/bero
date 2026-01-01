import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/stats - Fetch dashboard statistics
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
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get start of next 30 days for unassigned shifts
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    // 1. Unassigned shifts (shifts without assignments in the next 30 days)
    const shiftsInNext30Days = await prisma.shift.findMany({
      where: {
        fromDate: {
          lte: next30Days
        },
        OR: [
          { untilDate: null },
          { untilDate: { gte: today } }
        ]
      },
      include: {
        assignments: {
          where: {
            date: {
              gte: today,
              lte: next30Days
            }
          }
        }
      }
    });

    let unassignedShifts = 0;
    shiftsInNext30Days.forEach(shift => {
      // Check if shift needs more staff than assigned
      const datesNeedingStaff = new Set();
      const currentDate = new Date(Math.max(today.getTime(), shift.fromDate.getTime()));
      const endDate = shift.untilDate ? new Date(Math.min(shift.untilDate.getTime(), next30Days.getTime())) : next30Days;
      
      while (currentDate <= endDate) {
        datesNeedingStaff.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count assignments per date
      const assignmentsByDate = {};
      shift.assignments.forEach(assignment => {
        const dateKey = assignment.date.toISOString().split('T')[0];
        if (!assignmentsByDate[dateKey]) {
          assignmentsByDate[dateKey] = 0;
        }
        assignmentsByDate[dateKey]++;
      });

      // Count dates where staff required > assigned
      datesNeedingStaff.forEach(dateKey => {
        const assigned = assignmentsByDate[dateKey] || 0;
        if (assigned < shift.totalStaffRequired) {
          unassignedShifts++;
        }
      });
    });

    // 2. Late clock ins today
    const lateClockInsToday = await prisma.clockInOut.count({
      where: {
        date: {
          gte: today,
          lte: endOfToday
        },
        isLate: true
      }
    });

    // 3. Overdue tasks today (tasks with date < today and not completed)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Count all task types that are overdue
    // Only tasks with TaskCompletion 'completed' field are included
    const taskQueries = [
      prisma.bathingTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.bloodTestTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.bloodPressureTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.comfortCheckTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.foodDrinkTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.generalSupportTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.houseKeepingTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.muacTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.oralCareTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.oxygenTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.personCentredTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.pulseTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.repositionTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.temperatureTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.weightTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.encouragementTask.count({ where: { date: { lte: yesterday }, completed: { not: 'YES' } } }),
      prisma.followUpTask.count({ where: { date: { lte: yesterday }, status: { not: 'COMPLETED' } } })
    ];

    const taskCounts = await Promise.all(taskQueries.map(q => q.catch(() => 0)));
    const overdueTasks = taskCounts.reduce((sum, count) => sum + (count || 0), 0);

    // 4. Birthdays today (ServiceSeekers with birthday today)
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();

    // Filter in memory for birthdays (Prisma doesn't support day/month extraction easily)
    const allServiceSeekers = await prisma.serviceSeeker.findMany({
      where: {
        dateOfBirth: {
          not: null
        }
      },
      select: {
        dateOfBirth: true
      }
    });

    const birthdaysCount = allServiceSeekers.filter(seeker => {
      if (!seeker.dateOfBirth) return false;
      const birthDate = new Date(seeker.dateOfBirth);
      return birthDate.getMonth() + 1 === currentMonth && birthDate.getDate() === currentDay;
    }).length;

    // 5. Reviews (PolicyReview + ServiceSeekerMarReview)
    const policyReviews = await prisma.policyReview.count();
    const marReviews = await prisma.serviceSeekerMarReview.count();
    const totalReviews = policyReviews + marReviews;

    // 6. Rota'd Hours this week (sum of shift durations for assigned shifts this week)
    const shiftAssignmentsThisWeek = await prisma.shiftAssignment.findMany({
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: {
        shift: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      }
    });

    let rotaHours = 0;
    shiftAssignmentsThisWeek.forEach(assignment => {
      const startTime = assignment.shift.startTime.split(':');
      const endTime = assignment.shift.endTime.split(':');
      const startHours = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
      const endHours = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
      let duration = endHours - startHours;
      if (duration < 0) duration += 24; // Handle overnight shifts
      rotaHours += duration;
    });

    // 7. Staff count (active users)
    const staffCount = await prisma.user.count({
      where: {
        status: 'CURRENT'
      }
    });

    // 8. Service User count
    const serviceUserCount = await prisma.serviceSeeker.count();

    return NextResponse.json({
      success: true,
      data: {
        unassignedShifts,
        lateClockInsToday,
        overdueTasks,
        birthdays: birthdaysCount,
        reviews: totalReviews,
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

