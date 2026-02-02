'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/clock-in-out
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId'); // Filter by specific user (admin only)
    const date = searchParams.get('date'); // Filter by date (YYYY-MM-DD)
    const startDate = searchParams.get('startDate'); // Filter by date range
    const endDate = searchParams.get('endDate');
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const workType = searchParams.get('workType'); // REGULAR, STANDBY
    const isLate = searchParams.get('isLate'); // true/false
    const isEarly = searchParams.get('isEarly'); // true/false
    const view = searchParams.get('view'); // 'my' | 'all'

    let whereClause = {};

    // If view is 'my', only show records for the current user
    if (view === 'my') {
      whereClause.userId = decoded.userId;
    } else if (userId) {
      // Admin can filter by specific user
      whereClause.userId = parseInt(userId);
    }

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filter by service seeker
    if (serviceSeekerId) {
      whereClause.serviceSeekerId = parseInt(serviceSeekerId);
    }

    // Filter by work type
    if (workType) {
      whereClause.workType = workType;
    }

    // Filter by late/early
    if (isLate === 'true') {
      whereClause.isLate = true;
    } else if (isLate === 'false') {
      whereClause.isLate = false;
    }

    if (isEarly === 'true') {
      whereClause.isEarly = true;
    } else if (isEarly === 'false') {
      whereClause.isEarly = false;
    }

    // OPTIMIZATION: Add limit to prevent large result sets
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const clockInOuts = await prisma.clockInOut.findMany({
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
        serviceSeeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferredName: true
          }
        },
        shiftAssignment: {
          include: {
            shift: {
              include: {
                shiftType: {
                  select: { id: true, name: true }
                },
                serviceSeeker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    preferredName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: Math.min(limit, 200), // Cap at 200 to prevent memory issues
      skip
    });

    return NextResponse.json({
      success: true,
      data: clockInOuts
    });

  } catch (error) {
    console.error('GET /clock-in-out error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch clock in/out records',
      details: error.message
    }, { status: 500 });
  }
}

