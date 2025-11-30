'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/holidays/my - Get holidays for the logged-in user (Mobile App)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status'); // Optional: PENDING, APPROVED, REJECTED

    // Build where clause
    const whereClause = {
      userId: userId, // Only get holidays for the logged-in user
    };

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.OR = [
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      ];
    } else if (startDate) {
      // If only startDate provided, get holidays that end after this date
      whereClause.endDate = { gte: new Date(startDate) };
    } else if (endDate) {
      // If only endDate provided, get holidays that start before this date
      whereClause.startDate = { lte: new Date(endDate) };
    }

    // Fetch holidays for the user
    const holidays = await prisma.holiday.findMany({
      where: whereClause,
      include: {
        holidayType: {
          select: {
            id: true,
            name: true,
            description: true,
            isPaid: true,
            color: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' }
      ]
    });

    // Transform the data for mobile app (simplified format)
    const transformedHolidays = holidays.map(holiday => ({
      id: holiday.id,
      holidayType: {
        id: holiday.holidayType.id,
        name: holiday.holidayType.name,
        description: holiday.holidayType.description,
        isPaid: holiday.holidayType.isPaid,
        color: holiday.holidayType.color
      },
      startDate: holiday.startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: holiday.endDate.toISOString().split('T')[0], // YYYY-MM-DD format
      startTime: holiday.startTime || null,
      endTime: holiday.endTime || null,
      includeWeekends: holiday.includeWeekends,
      description: holiday.description || null,
      holidayHours: holiday.holidayHours || 0,
      status: holiday.status, // PENDING, APPROVED, REJECTED
      approvedBy: holiday.approvedBy ? {
        id: holiday.approvedBy.id,
        name: `${holiday.approvedBy.firstName} ${holiday.approvedBy.lastName}`
      } : null,
      approvedAt: holiday.approvedAt ? holiday.approvedAt.toISOString() : null,
      rejectionReason: holiday.rejectionReason || null,
      createdAt: holiday.createdAt.toISOString(),
      updatedAt: holiday.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: transformedHolidays,
      count: transformedHolidays.length
    });

  } catch (error) {
    console.error('GET /api/holidays/my error:', error);
    
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

