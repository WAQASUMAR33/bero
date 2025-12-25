'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/clock-in-out/clock-out
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();
    
    const {
      clockInOutId,
      location,
      notes
    } = body;

    // Find the clock in record
    let clockInOut;
    
    if (clockInOutId) {
      // Update specific clock in/out record
      clockInOut = await prisma.clockInOut.findUnique({
        where: { id: parseInt(clockInOutId) },
        include: {
          shiftAssignment: {
            include: {
              shift: true
            }
          }
        }
      });

      if (!clockInOut) {
        return NextResponse.json({ 
          success: false, 
          error: 'Clock in record not found' 
        }, { status: 404 });
      }

      // Convert both to integers to handle type mismatches (string vs number)
      const clockInOutUserId = Number(clockInOut.userId);
      const decodedUserId = Number(decoded.userId);
      
      // Debug logging for authorization mismatch
      if (clockInOutUserId !== decodedUserId) {
        console.error('Clock-out authorization mismatch:', {
          clockInOutId: clockInOut.id,
          clockInOutUserId: clockInOutUserId,
          clockInOutUserIdType: typeof clockInOut.userId,
          decodedUserId: decodedUserId,
          decodedUserIdType: typeof decoded.userId,
          rawClockInOutUserId: clockInOut.userId,
          rawDecodedUserId: decoded.userId
        });
        
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized to clock out this record',
          details: `Clock-in record belongs to user ${clockInOutUserId}, but token is for user ${decodedUserId}`
        }, { status: 403 });
      }

      if (clockInOut.clockOutTime) {
        return NextResponse.json({ 
          success: false, 
          error: 'Already clocked out' 
        }, { status: 400 });
      }
    } else {
      // Find the most recent clock in without clock out for this user
      clockInOut = await prisma.clockInOut.findFirst({
        where: {
          userId: decoded.userId,
          clockInTime: { not: null },
          clockOutTime: null
        },
        orderBy: {
          clockInTime: 'desc'
        },
        include: {
          shiftAssignment: {
            include: {
              shift: true
            }
          }
        }
      });

      if (!clockInOut) {
        return NextResponse.json({ 
          success: false, 
          error: 'No active clock in found' 
        }, { status: 404 });
      }
    }

    // Check if clocking out early
    let isEarly = false;
    if (clockInOut.shiftAssignment && clockInOut.shiftAssignment.shift) {
      const shiftDate = new Date(clockInOut.date);
      const [endHour, endMin] = clockInOut.shiftAssignment.shift.endTime.split(':').map(Number);
      const expectedClockOut = new Date(shiftDate);
      expectedClockOut.setHours(endHour, endMin, 0, 0);
      
      const clockOutTime = new Date();
      // Allow 15 minutes grace period
      const gracePeriod = 15 * 60 * 1000; // 15 minutes in milliseconds
      isEarly = clockOutTime < new Date(expectedClockOut.getTime() - gracePeriod);
    }

    // Update clock out
    const updated = await prisma.clockInOut.update({
      where: { id: clockInOut.id },
      data: {
        clockOutTime: new Date(),
        clockOutLocation: location || null,
        isEarly: isEarly,
        notes: notes ? (clockInOut.notes ? `${clockInOut.notes}\n${notes}` : notes) : clockInOut.notes
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
      data: updated,
      message: isEarly ? 'Clocked out (Early)' : 'Clocked out successfully'
    });

  } catch (error) {
    console.error('POST /clock-in-out/clock-out error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clock out', 
      details: error.message 
    }, { status: 500 });
  }
}

