'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/clock-in-out/clock-in
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();
    
    const {
      shiftAssignmentId,
      serviceSeekerId,
      date,
      workType = 'REGULAR',
      location,
      notes
    } = body;

    // Use today's date if not provided
    const clockInDate = date ? new Date(date) : new Date();
    clockInDate.setHours(0, 0, 0, 0);

    // Check if there's already a clock in record for this user on this date
    const existingRecord = await prisma.clockInOut.findFirst({
      where: {
        userId: decoded.userId,
        date: clockInDate,
        clockInTime: { not: null }
      }
    });

    if (existingRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already clocked in for this date' 
      }, { status: 400 });
    }

    // Find shift assignment if not provided
    let assignment = null;
    let finalShiftAssignmentId = null;
    let finalServiceSeekerId = serviceSeekerId ? parseInt(serviceSeekerId) : null;

    if (shiftAssignmentId) {
      // Use provided shift assignment
      assignment = await prisma.shiftAssignment.findUnique({
        where: { id: parseInt(shiftAssignmentId) },
        include: {
          shift: {
            include: {
              serviceSeeker: true
            }
          }
        }
      });

      if (assignment) {
        // Verify the assignment belongs to this user
        if (assignment.userId !== decoded.userId) {
          return NextResponse.json({ 
            success: false, 
            error: 'This shift assignment does not belong to you' 
          }, { status: 403 });
        }
        finalShiftAssignmentId = assignment.id;
        if (!finalServiceSeekerId && assignment.shift) {
          finalServiceSeekerId = assignment.shift.serviceSeekerId;
        }
      }
    } else {
      // Auto-find shift assignment for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: today,
          status: 'SCHEDULED'
        },
        include: {
          shift: {
            include: {
              serviceSeeker: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (assignment) {
        finalShiftAssignmentId = assignment.id;
        if (!finalServiceSeekerId && assignment.shift) {
          finalServiceSeekerId = assignment.shift.serviceSeekerId;
        }
      }
    }

    // Check if late based on shift start time
    let isLate = false;
    if (assignment && assignment.shift) {
      // Calculate expected clock in time (shift start time on the date)
      const shiftDate = new Date(assignment.date);
      const [startHour, startMin] = assignment.shift.startTime.split(':').map(Number);
      const expectedClockIn = new Date(shiftDate);
      expectedClockIn.setHours(startHour, startMin, 0, 0);
      
      const clockInTime = new Date();
      // Allow 15 minutes grace period
      const gracePeriod = 15 * 60 * 1000; // 15 minutes in milliseconds
      isLate = clockInTime > new Date(expectedClockIn.getTime() + gracePeriod);
    }

    // Create clock in record
    const clockInOut = await prisma.clockInOut.create({
      data: {
        userId: decoded.userId,
        shiftAssignmentId: finalShiftAssignmentId,
        serviceSeekerId: finalServiceSeekerId,
        date: clockInDate,
        clockInTime: new Date(),
        workType: workType,
        clockInLocation: location || null,
        isLate: isLate,
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        },
        shiftAssignment: {
          include: {
            shift: {
              include: {
                shiftType: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: clockInOut,
      message: isLate ? 'Clocked in (Late)' : 'Clocked in successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /clock-in-out/clock-in error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clock in', 
      details: error.message 
    }, { status: 500 });
  }
}

