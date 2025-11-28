'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/clock-in-out/my-shifts
// Get the current user's assigned shifts for today (or specified date)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { searchParams } = new URL(request.url);
    
    const dateParam = searchParams.get('date'); // Optional: YYYY-MM-DD format
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    // Get shift assignments for this user on this date
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        userId: decoded.userId,
        date: date,
        status: 'SCHEDULED'
      },
      include: {
        shift: {
          include: {
            serviceSeeker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                preferredName: true,
                address: true,
                latitude: true,
                longitude: true
              }
            },
            shiftType: {
              select: {
                id: true,
                name: true
              }
            },
            funder: {
              select: {
                id: true,
                fundingSource: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Check which assignments have been clocked in
    const clockInOuts = await prisma.clockInOut.findMany({
      where: {
        userId: decoded.userId,
        date: date
      },
      select: {
        id: true,
        shiftAssignmentId: true,
        clockInTime: true,
        clockOutTime: true,
        isLate: true,
        isEarly: true
      }
    });

    // Map clock in/out records by shift assignment ID
    const clockInOutMap = {};
    clockInOuts.forEach(cio => {
      if (cio.shiftAssignmentId) {
        clockInOutMap[cio.shiftAssignmentId] = cio;
      }
    });

    // Transform assignments with clock in/out status
    const shiftsWithStatus = assignments.map(assignment => {
      const clockInOut = clockInOutMap[assignment.id];
      const shift = assignment.shift;
      
      // Calculate expected times
      const shiftDate = new Date(assignment.date);
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      const expectedStart = new Date(shiftDate);
      expectedStart.setHours(startHour, startMin, 0, 0);
      
      const expectedEnd = new Date(shiftDate);
      expectedEnd.setHours(endHour, endMin, 0, 0);

      return {
        shiftAssignmentId: assignment.id,
        shiftId: shift.id,
        date: assignment.date,
        expectedStartTime: expectedStart.toISOString(),
        expectedEndTime: expectedEnd.toISOString(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        serviceSeeker: shift.serviceSeeker,
        shiftType: shift.shiftType,
        funder: shift.funder,
        timeCritical: shift.timeCritical,
        notesForCarers: shift.notesForCarers,
        status: assignment.status,
        clockedIn: !!clockInOut,
        clockInTime: clockInOut?.clockInTime || null,
        clockOutTime: clockInOut?.clockOutTime || null,
        isLate: clockInOut?.isLate || false,
        isEarly: clockInOut?.isEarly || false,
        clockInOutId: clockInOut?.id || null
      };
    });

    return NextResponse.json({
      success: true,
      data: shiftsWithStatus,
      date: date.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('GET /clock-in-out/my-shifts error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch shifts', 
      details: error.message 
    }, { status: 500 });
  }
}

