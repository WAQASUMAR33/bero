'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
      },
      orderBy: { fromDate: 'asc' }
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('GET /shifts error:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
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
      notesForManager
    } = body;

    if (!serviceSeekerId || !fromDate || !recurrence || !startTime || !endTime || !shiftTypeId) {
      return NextResponse.json({
        error: 'serviceSeekerId, fromDate, recurrence, startTime, endTime, and shiftTypeId are required'
      }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        serviceSeekerId,
        fromDate: new Date(fromDate),
        untilDate: untilDate ? new Date(untilDate) : null,
        recurrence,
        startTime,
        endTime,
        shiftTypeId,
        totalStaffRequired: totalStaffRequired || 1,
        funderId: funderId || null,
        timeCritical: timeCritical || false,
        shiftRunId: shiftRunId || null,
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
        }
      }
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('POST /shifts error:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}

