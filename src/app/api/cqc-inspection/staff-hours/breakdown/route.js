'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to calculate hours between two time strings (HH:mm format)
function calculateHoursFromTimes(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts (end time is next day)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  const diffMinutes = endMinutes - startMinutes;
  return diffMinutes / 60; // Convert to hours
}

// Helper function to calculate hours from DateTime objects
function calculateHoursFromDates(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const diffMs = new Date(endDate) - new Date(startDate);
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

// Format date and time range for display
function formatDateTimeRange(date, startTime, endTime) {
  const d = new Date(date);
  const day = d.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  // Parse times
  const [startHour, startMin] = startTime.split(':');
  const [endHour, endMin] = endTime.split(':');
  
  // Handle overnight shifts
  let endDate = new Date(date);
  const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
  const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
  
  if (endMinutes < startMinutes) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  const endDay = endDate.getDate();
  const endMonth = monthNames[endDate.getMonth()];
  const endYear = endDate.getFullYear();
  
  if (endDate.getTime() === d.getTime()) {
    // Same day
    return `${day} ${month} ${year} ${startTime} to ${endTime}`;
  } else {
    // Overnight shift
    return `${day} ${month} ${year} ${startTime} to ${endDay} ${endMonth} ${endYear} ${endTime}`;
  }
}

// GET /api/cqc-inspection/staff-hours/breakdown
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'));
    const month = parseInt(searchParams.get('month')); // 0-11
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    if (!userId || month === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId and month are required' 
      }, { status: 400 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Calculate month date range
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get all shift assignments for this user in this month
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        userId: userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED']
        }
      },
      include: {
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            serviceSeeker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                preferredName: true
              }
            }
          }
        },
        clockInOuts: {
          select: {
            clockInTime: true,
            clockOutTime: true
          },
          orderBy: {
            clockInTime: 'asc'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Format breakdown data
    const breakdown = assignments.map(assignment => {
      let hours = 0;
      let startTime = assignment.shift.startTime;
      let endTime = assignment.shift.endTime;
      let displayDate = formatDateTimeRange(assignment.date, startTime, endTime);

      // Prefer actual clock in/out times if available
      if (assignment.clockInOuts && assignment.clockInOuts.length > 0) {
        assignment.clockInOuts.forEach(cio => {
          if (cio.clockInTime && cio.clockOutTime) {
            hours += calculateHoursFromDates(cio.clockInTime, cio.clockOutTime);
            // Use actual times for display
            const clockIn = new Date(cio.clockInTime);
            const clockOut = new Date(cio.clockOutTime);
            const clockInStr = `${String(clockIn.getHours()).padStart(2, '0')}:${String(clockIn.getMinutes()).padStart(2, '0')}`;
            const clockOutStr = `${String(clockOut.getHours()).padStart(2, '0')}:${String(clockOut.getMinutes()).padStart(2, '0')}`;
            
            const d = new Date(assignment.date);
            const day = d.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[d.getMonth()];
            const year = d.getFullYear();
            
            // Check if overnight
            const clockOutDate = new Date(cio.clockOutTime);
            if (clockOutDate.getDate() !== d.getDate() || clockOutDate.getMonth() !== d.getMonth()) {
              const endDay = clockOutDate.getDate();
              const endMonth = monthNames[clockOutDate.getMonth()];
              const endYear = clockOutDate.getFullYear();
              displayDate = `${day} ${monthName} ${year} ${clockInStr} to ${endDay} ${endMonth} ${endYear} ${clockOutStr}`;
            } else {
              displayDate = `${day} ${monthName} ${year} ${clockInStr} to ${clockOutStr}`;
            }
          }
        });
      } else {
        // Use shift scheduled times
        hours = calculateHoursFromTimes(assignment.shift.startTime, assignment.shift.endTime);
      }

      // Get service user name
      const serviceUserName = assignment.shift.serviceSeeker.preferredName || 
                             `${assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName}`;

      return {
        date: assignment.date,
        displayDate: displayDate,
        shift: serviceUserName,
        hours: parseFloat(hours.toFixed(2))
      };
    });

    // Calculate total hours
    const totalHours = breakdown.reduce((sum, item) => sum + item.hours, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        staffName: `${user.firstName} ${user.lastName}`,
        month: monthNames[month],
        year: year,
        breakdown: breakdown,
        totalHours: parseFloat(totalHours.toFixed(2))
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/staff-hours/breakdown error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch breakdown',
      details: error.message 
    }, { status: 500 });
  }
}

