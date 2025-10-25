'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single person centred task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.personCentredTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        taskName: true,
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
        { error: 'Person centred task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /person-centred-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person centred task' },
      { status: 500 }
    );
  }
}

// PUT - Update person centred task
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
      serviceSeekerId: parseInt(serviceSeekerId),
      date,
      time,
      nameId,
      notes,
      photoUrl,
      completed,
      emotion
    } = body;

    const task = await prisma.personCentredTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        nameId,
        notes: notes || null,
        photoUrl: photoUrl || null,
        completed,
        emotion,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: true,
        taskName: true,
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
    console.error('PUT /person-centred-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update person centred task' },
      { status: 500 }
    );
  }
}

// DELETE person centred task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.personCentredTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Person centred task deleted successfully' });
  } catch (error) {
    console.error('DELETE /person-centred-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete person centred task' },
      { status: 500 }
    );
  }
}
