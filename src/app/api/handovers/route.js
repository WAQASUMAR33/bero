import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all handovers
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const date = searchParams.get('date');
    const userId = searchParams.get('userId'); // Filter by user (from or to)

    const where = {};

    if (serviceSeekerId) {
      where.serviceSeekerId = parseInt(serviceSeekerId);
    }

    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      where.createdAt = {
        gte: dateObj,
        lt: nextDay
      };
    }

    if (userId) {
      where.OR = [
        {
          fromShiftAssignment: {
            userId: parseInt(userId)
          }
        },
        {
          toShiftAssignment: {
            userId: parseInt(userId)
          }
        }
      ];
    }

    const handovers = await prisma.handover.findMany({
      where,
      include: {
        fromShiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            shift: {
              include: {
                serviceSeeker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    preferredName: true,
                    address: true
                  }
                }
              }
            }
          }
        },
        toShiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            shift: {
              include: {
                serviceSeeker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    preferredName: true,
                    address: true
                  }
                }
              }
            }
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: handovers
    });
  } catch (error) {
    console.error('GET /handovers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch handovers', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new handover
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const {
      fromShiftAssignmentId,
      toShiftAssignmentId,
      handoverNotes,
      remainingTasks,
      visits,
      issues
    } = body;

    // Validate required fields
    if (!fromShiftAssignmentId || !toShiftAssignmentId) {
      return NextResponse.json(
        { success: false, error: 'From and To shift assignments are required' },
        { status: 400 }
      );
    }

    // Get both shift assignments to validate location match
    const fromAssignment = await prisma.shiftAssignment.findUnique({
      where: { id: parseInt(fromShiftAssignmentId) },
      include: {
        shift: {
          select: {
            serviceSeekerId: true
          }
        }
      }
    });

    const toAssignment = await prisma.shiftAssignment.findUnique({
      where: { id: parseInt(toShiftAssignmentId) },
      include: {
        shift: {
          select: {
            serviceSeekerId: true
          }
        }
      }
    });

    if (!fromAssignment || !toAssignment) {
      return NextResponse.json(
        { success: false, error: 'One or both shift assignments not found' },
        { status: 404 }
      );
    }

    // Validate that both shifts are at the same location (serviceSeekerId)
    if (fromAssignment.shift.serviceSeekerId !== toAssignment.shift.serviceSeekerId) {
      return NextResponse.json(
        { success: false, error: 'Handover can only occur between shifts at the same location' },
        { status: 400 }
      );
    }

    const serviceSeekerId = fromAssignment.shift.serviceSeekerId;

    // Create handover
    const handover = await prisma.handover.create({
      data: {
        fromShiftAssignmentId: parseInt(fromShiftAssignmentId),
        toShiftAssignmentId: parseInt(toShiftAssignmentId),
        serviceSeekerId,
        handoverNotes: handoverNotes || null,
        remainingTasks: remainingTasks ? JSON.parse(JSON.stringify(remainingTasks)) : null,
        visits: visits ? JSON.parse(JSON.stringify(visits)) : null,
        issues: issues || null,
        createdById: decoded.userId
      },
      include: {
        fromShiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            shift: {
              include: {
                serviceSeeker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    preferredName: true,
                    address: true
                  }
                }
              }
            }
          }
        },
        toShiftAssignment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            shift: {
              include: {
                serviceSeeker: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    preferredName: true,
                    address: true
                  }
                }
              }
            }
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
      data: handover
    }, { status: 201 });
  } catch (error) {
    console.error('POST /handovers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create handover', details: error.message },
      { status: 500 }
    );
  }
}

