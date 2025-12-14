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

// GET /api/cqc-inspection/staff-hours
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    // Get all current staff
    const staff = await prisma.user.findMany({
      where: {
        status: 'CURRENT'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Initialize result structure
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = staff.map(user => ({
      userId: user.id,
      staffName: `${user.firstName} ${user.lastName}`,
      employeeNumber: user.employeeNumber,
      months: {}
    }));

    // For each month, calculate hours
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Get all shift assignments for this month
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd
          },
          status: {
            in: ['SCHEDULED', 'COMPLETED'] // Include both scheduled and completed
          }
        },
        include: {
          shift: {
            select: {
              id: true,
              startTime: true,
              endTime: true
            }
          },
          clockInOuts: {
            select: {
              clockInTime: true,
              clockOutTime: true
            }
          }
        }
      });

      // Group by user and calculate hours
      const userHours = {};
      
      assignments.forEach(assignment => {
        const userId = assignment.userId;
        if (!userHours[userId]) {
          userHours[userId] = 0;
        }

        // Prefer actual clock in/out times if available
        if (assignment.clockInOuts && assignment.clockInOuts.length > 0) {
          assignment.clockInOuts.forEach(cio => {
            if (cio.clockInTime && cio.clockOutTime) {
              const hours = calculateHoursFromDates(cio.clockInTime, cio.clockOutTime);
              userHours[userId] += hours;
            }
          });
        } else {
          // Use shift scheduled times
          const hours = calculateHoursFromTimes(assignment.shift.startTime, assignment.shift.endTime);
          userHours[userId] += hours;
        }
      });

      // Update result for each user
      result.forEach(userData => {
        userData.months[months[month]] = userHours[userData.userId] || 0;
      });
    }

    // Calculate totals for each user
    result.forEach(userData => {
      let total = 0;
      months.forEach(month => {
        total += userData.months[month] || 0;
      });
      userData.total = total;
    });

    // Calculate totals for each month
    const monthTotals = {};
    months.forEach(month => {
      monthTotals[month] = result.reduce((sum, user) => sum + (user.months[month] || 0), 0);
    });
    const grandTotal = result.reduce((sum, user) => sum + (user.total || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        staff: result,
        monthTotals,
        grandTotal,
        year
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/staff-hours error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch staff hours',
      details: error.message 
    }, { status: 500 });
  }
}

