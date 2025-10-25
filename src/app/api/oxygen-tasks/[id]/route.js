'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single oxygen task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.oxygenTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
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
        { error: 'Oxygen task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oxygen task' },
      { status: 500 }
    );
  }
}

// PUT - Update oxygen task
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
      date,
      time,
      quantity,
      notes,
      completed,
      emotion
    } = body;

    const task = await prisma.oxygenTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        quantity,
        notes: notes || null,
        completed,
        emotion,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: true,
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
    console.error('PUT /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update oxygen task' },
      { status: 500 }
    );
  }
}

// DELETE oxygen task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.oxygenTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Oxygen task deleted successfully' });
  } catch (error) {
    console.error('DELETE /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete oxygen task' },
      { status: 500 }
    );
  }
}
