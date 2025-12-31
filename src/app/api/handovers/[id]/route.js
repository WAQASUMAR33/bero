import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET single handover
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const handoverId = parseInt(id);

    const handover = await prisma.handover.findUnique({
      where: { id: handoverId },
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
                },
                shiftType: {
                  select: {
                    id: true,
                    name: true
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
                },
                shiftType: {
                  select: {
                    id: true,
                    name: true
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

    if (!handover) {
      return NextResponse.json(
        { success: false, error: 'Handover not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: handover
    });
  } catch (error) {
    console.error('GET /handovers/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch handover', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete handover
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const handoverId = parseInt(id);

    // Check if handover exists
    const handover = await prisma.handover.findUnique({
      where: { id: handoverId }
    });

    if (!handover) {
      return NextResponse.json(
        { success: false, error: 'Handover not found' },
        { status: 404 }
      );
    }

    // Delete handover
    await prisma.handover.delete({
      where: { id: handoverId }
    });

    return NextResponse.json({
      success: true,
      message: 'Handover deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /handovers/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete handover', details: error.message },
      { status: 500 }
    );
  }
}

