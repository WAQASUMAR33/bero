'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/shifts/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftId = parseInt(id);
    const shiftId = parseInt(id);
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true, photoUrl: true }
        },
        shiftType: true,
        funder: true,
        shiftRun: true,
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
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error('GET /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

// PUT /api/shifts/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftId = parseInt(id);
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

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...(serviceSeekerId && { serviceSeekerId: parseInt(serviceSeekerId) }),
        ...(fromDate && { fromDate: new Date(fromDate) }),
        ...(untilDate !== undefined && { untilDate: untilDate ? new Date(untilDate) : null }),
        ...(recurrence && { recurrence }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(shiftTypeId && { shiftTypeId: parseInt(shiftTypeId) }),
        ...(totalStaffRequired !== undefined && { totalStaffRequired }),
        ...(funderId !== undefined && { funderId: funderId ? parseInt(funderId) : null }),
        ...(timeCritical !== undefined && { timeCritical }),
        ...(shiftRunId !== undefined && { shiftRunId: shiftRunId ? parseInt(shiftRunId) : null }),
        ...(notesForCarers !== undefined && { notesForCarers }),
        ...(notesForManager !== undefined && { notesForManager }),
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

    return NextResponse.json(shift);
  } catch (error) {
    console.error('PUT /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

// DELETE /api/shifts/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftId = parseInt(id);
    
    // Delete related assignments first
    await prisma.shiftAssignment.deleteMany({
      where: { shiftId: shiftId }
    });

    // Then delete the shift
    await prisma.shift.delete({
      where: { id: shiftId }
    });

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('DELETE /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}

