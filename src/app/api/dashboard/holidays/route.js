import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/holidays - Fetch upcoming holiday requests for dashboard
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get holidays for next 30 days (including pending, approved)
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    const holidays = await prisma.holiday.findMany({
      where: {
        endDate: {
          gte: today
        },
        startDate: {
          lte: next30Days
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        holidayType: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 10 // Limit to 10 upcoming holidays
    });

    const formattedHolidays = holidays.map(holiday => {
      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      
      // Format date range
      let dateDisplay = '';
      if (startDate.toDateString() === endDate.toDateString()) {
        // Same day
        dateDisplay = startDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        // Date range
        dateDisplay = `${startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}`;
      }
      
      // Format time if available
      let timeDisplay = '';
      if (holiday.startTime && holiday.endTime) {
        timeDisplay = `${holiday.startTime} - ${holiday.endTime}`;
      }
      
      const userName = `${holiday.user.firstName} ${holiday.user.lastName}`;
      const holidayTypeName = holiday.holidayType.name;
      
      // Status badge color
      let statusColor = 'bg-gray-100 text-gray-700';
      if (holiday.status === 'APPROVED') {
        statusColor = 'bg-green-100 text-green-700';
      } else if (holiday.status === 'REJECTED') {
        statusColor = 'bg-red-100 text-red-700';
      } else if (holiday.status === 'PENDING') {
        statusColor = 'bg-yellow-100 text-yellow-700';
      }

      return {
        id: holiday.id,
        date: dateDisplay,
        time: timeDisplay,
        userName,
        holidayType: holidayTypeName,
        status: holiday.status,
        statusColor,
        description: holiday.description || '',
        startDate: holiday.startDate,
        endDate: holiday.endDate
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedHolidays
    });
  } catch (error) {
    console.error('Error fetching dashboard holidays:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

