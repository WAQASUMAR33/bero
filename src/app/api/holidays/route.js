'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to calculate holiday hours
function calculateHolidayHours(startDate, endDate, startTime, endTime, includeWeekends) {
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  let totalHours = 0;

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends if includeWeekends is false
    if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    if (startTime && endTime) {
      // Calculate hours for the day
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startDateTime = new Date(currentDate);
      startDateTime.setHours(startHour, startMin, 0, 0);
      const endDateTime = new Date(currentDate);
      endDateTime.setHours(endHour, endMin, 0, 0);
      
      const diffMs = endDateTime - startDateTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      totalHours += diffHours;
    } else {
      // Full day (24 hours)
      totalHours += 24;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalHours;
}

// GET /api/holidays
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const view = searchParams.get('view'); // 'my' | 'all'

    let whereClause = {};

    // If view is 'my', only show holidays for the current user
    if (view === 'my') {
      whereClause.userId = decoded.userId;
    } else if (userId) {
      // Admin can filter by specific user
      whereClause.userId = parseInt(userId);
    }

    // Filter by date range
    if (startDate && endDate) {
      whereClause.OR = [
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      ];
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const holidays = await prisma.holiday.findMany({
      where: whereClause,
      include: {
        user: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            email: true
          }
        },
        holidayType: true,
        approvedBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        },
        createdBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        },
        updatedBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('GET /holidays error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch holidays', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/holidays
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();
    
    const {
      userId,
      holidayTypeId,
      startDate,
      endDate,
      startTime,
      endTime,
      includeWeekends,
      description,
      holidayHours
    } = body;

    if (!userId || !holidayTypeId || !startDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId, holidayTypeId, startDate, and endDate are required' 
      }, { status: 400 });
    }

    // Calculate holiday hours if not provided
    let calculatedHours = holidayHours;
    if (!calculatedHours) {
      calculatedHours = calculateHolidayHours(
        new Date(startDate),
        new Date(endDate),
        startTime,
        endTime,
        includeWeekends || false
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        userId: parseInt(userId),
        holidayTypeId: parseInt(holidayTypeId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime || null,
        endTime: endTime || null,
        includeWeekends: includeWeekends || false,
        description: description || null,
        holidayHours: calculatedHours,
        status: 'PENDING',
        createdById: decoded.userId,
        updatedById: decoded.userId
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
        holidayType: true,
        createdBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: holiday
    }, { status: 201 });
  } catch (error) {
    console.error('POST /holidays error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create holiday', 
      details: error.message 
    }, { status: 500 });
  }
}



