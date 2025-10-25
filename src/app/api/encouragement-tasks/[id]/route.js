'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single encouragement task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.encouragementTask.findUnique({
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
        { error: 'Encouragement task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /encouragement-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encouragement task' },
      { status: 500 }
    );
  }
}

// PUT - Update encouragement task
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
      encouragement,
      note,
      completed,
      emotion
    } = body;

    const task = await prisma.encouragementTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        encouragement,
        note: note || null,
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
    console.error('PUT /encouragement-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update encouragement task' },
      { status: 500 }
    );
  }
}

// DELETE encouragement task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.encouragementTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Encouragement task deleted successfully' });
  } catch (error) {
    console.error('DELETE /encouragement-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete encouragement task' },
      { status: 500 }
    );
  }
}

