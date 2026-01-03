'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to check if a date matches the shift recurrence pattern
function doesDateMatchRecurrence(shift, checkDate) {
  const fromDate = new Date(shift.fromDate);
  fromDate.setHours(0, 0, 0, 0);
  const untilDate = shift.untilDate ? new Date(shift.untilDate) : null;
  const date = new Date(checkDate);
  date.setHours(0, 0, 0, 0);

  // Check if date is within the shift's date range
  if (date < fromDate) return false;
  if (untilDate && date > untilDate) return false;

  // Check recurrence pattern
  const daysDiff = Math.floor((date - fromDate) / (1000 * 60 * 60 * 24));

  switch (shift.recurrence) {
    case 'DAILY':
      return true;
    case 'WEEK':
      return daysDiff % 7 === 0;
    case 'TWO_WEEK':
      return daysDiff % 14 === 0;
    case 'THREE_WEEK':
      return daysDiff % 21 === 0;
    case 'FOUR_WEEK':
      return daysDiff % 28 === 0;
    case 'FIVE_WEEK':
      return daysDiff % 35 === 0;
    case 'SIX_WEEK':
      return daysDiff % 42 === 0;
    case 'SEVEN_WEEK':
      return daysDiff % 49 === 0;
    case 'EIGHT_WEEK':
      return daysDiff % 56 === 0;
    case 'NINE_WEEK':
      return daysDiff % 63 === 0;
    case 'TEN_WEEK':
      return daysDiff % 70 === 0;
    case 'TWO_DAY':
      return daysDiff % 2 === 0;
    case 'THREE_DAY':
      return daysDiff % 3 === 0;
    case 'FOUR_DAY':
      return daysDiff % 4 === 0;
    case 'FIVE_DAY':
      return daysDiff % 5 === 0;
    case 'SIX_DAY':
      return daysDiff % 6 === 0;
    default:
      return false;
  }
}

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
      shiftId, // Allow shiftId as alternative to shiftAssignmentId
      serviceSeekerId,
      date,
      workType = 'REGULAR',
      location,
      notes
    } = body;

    // Use today's date if not provided
    const clockInDate = date ? new Date(date) : new Date();
    clockInDate.setHours(0, 0, 0, 0);

    // Find shift assignment if not provided
    let assignment = null;
    let finalShiftAssignmentId = null;
    let finalServiceSeekerId = serviceSeekerId ? parseInt(serviceSeekerId) : null;

    // If shiftId is provided instead of shiftAssignmentId, try to find or create assignment
    if (shiftId && !shiftAssignmentId) {
      
      // First try to find existing assignment
      assignment = await prisma.shiftAssignment.findFirst({
        where: {
          shiftId: parseInt(shiftId),
          userId: decoded.userId,
          date: clockInDate,
          status: 'SCHEDULED'
        },
        include: {
          shift: {
            include: {
              serviceSeeker: true
            }
          }
        }
      });
      
      // If no assignment exists, try to create one
      if (!assignment) {
        const shift = await prisma.shift.findUnique({
          where: { id: parseInt(shiftId) },
          include: {
            serviceSeeker: true
          }
        });
        
        if (shift) {
          // Verify the shift is valid for this date (including recurrence pattern)
          if (doesDateMatchRecurrence(shift, clockInDate)) {
            try {
              // Create assignment on-the-fly
              assignment = await prisma.shiftAssignment.create({
                data: {
                  shiftId: shift.id,
                  userId: decoded.userId,
                  date: clockInDate,
                  status: 'SCHEDULED'
                },
                include: {
                  shift: {
                    include: {
                      serviceSeeker: true
                    }
                  }
                }
              });
              console.log(`Created shift assignment on-the-fly: shiftId=${shift.id}, userId=${decoded.userId}, date=${clockInDate.toISOString()}`);
            } catch (createError) {
              console.error('Failed to create shift assignment:', createError);
              // Continue to try finding by other methods
            }
          }
        }
      }
      
      if (assignment) {
        finalShiftAssignmentId = assignment.id;
        if (!finalServiceSeekerId && assignment.shift) {
          finalServiceSeekerId = assignment.shift.serviceSeekerId;
        }
      }
    } else if (shiftAssignmentId) {
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

      if (!assignment) {
        // Shift assignment not found - try to find or create assignment
        console.warn(`Shift assignment ${shiftAssignmentId} not found, attempting to find or create assignment`);
        
        // First, if shiftId is provided, try to find or create assignment for that shift
        if (shiftId) {
          const shift = await prisma.shift.findUnique({
            where: { id: parseInt(shiftId) },
            include: {
              serviceSeeker: true
            }
          });
          
          if (shift) {
            // Check if assignment exists
            assignment = await prisma.shiftAssignment.findFirst({
              where: {
                shiftId: shift.id,
                userId: decoded.userId,
                date: clockInDate,
                status: 'SCHEDULED'
              },
              include: {
                shift: {
                  include: {
                    serviceSeeker: true
                  }
                }
              }
            });
            
            // If no assignment exists, create one
            if (!assignment) {
              // Verify the shift is valid for this date (including recurrence pattern)
              if (doesDateMatchRecurrence(shift, clockInDate)) {
                try {
                  assignment = await prisma.shiftAssignment.create({
                    data: {
                      shiftId: shift.id,
                      userId: decoded.userId,
                      date: clockInDate,
                      status: 'SCHEDULED'
                    },
                    include: {
                      shift: {
                        include: {
                          serviceSeeker: true
                        }
                      }
                    }
                  });
                  console.log(`Created shift assignment on-the-fly: shiftId=${shift.id}, userId=${decoded.userId}, date=${clockInDate.toISOString()}`);
                } catch (createError) {
                  console.error('Failed to create shift assignment:', createError);
                }
              }
            }
          }
        }
        
        // If still no assignment, try to find any assignment for this user on this date
        if (!assignment) {
          assignment = await prisma.shiftAssignment.findFirst({
            where: {
              userId: decoded.userId,
              date: clockInDate,
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
        }
        
        if (assignment) {
          finalShiftAssignmentId = assignment.id;
          if (!finalServiceSeekerId && assignment.shift) {
            finalServiceSeekerId = assignment.shift.serviceSeekerId;
          }
        } else {
          // If still not found, try to find a shift by serviceSeekerId and create assignment
          if (serviceSeekerId) {
            const potentialShift = await prisma.shift.findFirst({
              where: {
                serviceSeekerId: parseInt(serviceSeekerId),
                fromDate: { lte: clockInDate },
                OR: [
                  { untilDate: null },
                  { untilDate: { gte: clockInDate } }
                ]
              },
              include: {
                serviceSeeker: true
              },
              orderBy: {
                fromDate: 'desc'
              }
            });

            if (potentialShift) {
              try {
                // Create assignment on-the-fly
                assignment = await prisma.shiftAssignment.create({
                  data: {
                    shiftId: potentialShift.id,
                    userId: decoded.userId,
                    date: clockInDate,
                    status: 'SCHEDULED'
                  },
                  include: {
                    shift: {
                      include: {
                        serviceSeeker: true
                      }
                    }
                  }
                });
                finalShiftAssignmentId = assignment.id;
                if (!finalServiceSeekerId) {
                  finalServiceSeekerId = assignment.shift.serviceSeekerId;
                }
              } catch (createError) {
                console.error('Failed to create shift assignment:', createError);
                return NextResponse.json({ 
                  success: false, 
                  error: 'Shift assignment not found. Please ensure you are assigned to this shift.' 
                }, { status: 404 });
              }
            } else {
              return NextResponse.json({ 
                success: false, 
                error: 'Shift assignment not found. Please ensure you are assigned to this shift.' 
              }, { status: 404 });
            }
          } else {
            return NextResponse.json({ 
              success: false, 
              error: 'Shift assignment not found. Please ensure you are assigned to this shift.' 
            }, { status: 404 });
          }
        }
      } else {
        // Verify the assignment belongs to this user
        // Convert both to integers to handle type mismatches (string vs number)
        const assignmentUserId = Number(assignment.userId);
        const decodedUserId = Number(decoded.userId);
        if (assignmentUserId !== decodedUserId) {
          console.error('Shift assignment ownership mismatch:', {
            assignmentUserId,
            decodedUserId,
            shiftAssignmentId,
            assignmentUserIdType: typeof assignment.userId,
            decodedUserIdType: typeof decoded.userId
          });
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
      // Auto-find shift assignment for the clock-in date
      assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: clockInDate,
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

    // Validate that we have an assignment before proceeding
    if (!assignment || !finalShiftAssignmentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid shift assignment found. Please ensure you are assigned to a shift for this date.' 
      }, { status: 404 });
    }

    // Check if there's already a clock in record for this specific shift assignment
    // This prevents clocking in multiple times to the same shift, even after clocking out
    const existingRecord = await prisma.clockInOut.findFirst({
      where: {
        userId: decoded.userId,
        shiftAssignmentId: finalShiftAssignmentId,
        clockInTime: { not: null }
      }
    });

    if (existingRecord) {
      if (existingRecord.clockOutTime === null) {
        // Active clock in exists
        return NextResponse.json({ 
          success: false, 
          error: 'You have already clocked in for this shift. Please clock out first before clocking in again.' 
        }, { status: 400 });
      } else {
        // Already clocked in and out for this shift
        return NextResponse.json({ 
          success: false, 
          error: 'You have already completed this shift. You cannot clock in again to the same shift assignment.' 
        }, { status: 400 });
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

