import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET available shifts for handover (shifts at the same location)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const fromShiftAssignmentId = searchParams.get('fromShiftAssignmentId');
    const date = searchParams.get('date'); // Optional: filter by date

    if (!fromShiftAssignmentId) {
      return NextResponse.json(
        { success: false, error: 'fromShiftAssignmentId is required' },
        { status: 400 }
      );
    }

    // Get the from shift assignment to find the location
    const fromAssignment = await prisma.shiftAssignment.findUnique({
      where: { id: parseInt(fromShiftAssignmentId) },
      include: {
        shift: {
          select: {
            serviceSeekerId: true,
            startTime: true,
            endTime: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!fromAssignment) {
      return NextResponse.json(
        { success: false, error: 'Shift assignment not found' },
        { status: 404 }
      );
    }

    const serviceSeekerId = fromAssignment.shift.serviceSeekerId;
    const assignmentDate = date ? new Date(date) : fromAssignment.date;

    // Find all shift assignments at the same location (serviceSeekerId) on the same date
    // Exclude the current assignment and exclude the same user
    const availableAssignments = await prisma.shiftAssignment.findMany({
      where: {
        shift: {
          serviceSeekerId: serviceSeekerId
        },
        date: assignmentDate,
        id: {
          not: parseInt(fromShiftAssignmentId)
        },
        userId: {
          not: fromAssignment.userId
        },
        status: 'SCHEDULED'
      },
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
            },
            shiftType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        shift: {
          startTime: 'asc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fromAssignment: {
          id: fromAssignment.id,
          user: fromAssignment.user,
          shift: fromAssignment.shift
        },
        availableAssignments
      }
    });
  } catch (error) {
    console.error('GET /handovers/available error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available shifts', details: error.message },
      { status: 500 }
    );
  }
}

