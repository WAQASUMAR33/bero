'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single medicine PRN task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.medicinePrnTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Medicine PRN task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicine PRN task' },
      { status: 500 }
    );
  }
}

// PUT - Update medicine PRN task
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();
    const {
      serviceSeekerId,
      applyDate,
      applyTime,
      prn,
      medicineName,
      medicineType,
      administrated,
      notes,
      requestSignoffBy,
      signoffByStaffId: parseInt(signoffByStaffId),
      completed,
      emotion
    } = body;

    const task = await prisma.medicinePrnTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        applyDate: new Date(applyDate),
        applyTime,
        prn,
        medicineName,
        medicineType,
        administrated,
        notes: notes || null,
        requestSignoffBy,
        signoffByStaffId: requestSignoffBy === 'REQUIRED' ? signoffByStaffId : null,
        completed,
        emotion,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine PRN task' },
      { status: 500 }
    );
  }
}

// DELETE medicine PRN task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.medicinePrnTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Medicine PRN task deleted successfully' });
  } catch (error) {
    console.error('DELETE /medicine-prn-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine PRN task' },
      { status: 500 }
    );
  }
}

