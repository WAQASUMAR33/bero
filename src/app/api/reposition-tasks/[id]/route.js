'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single reposition task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.repositionTask.findUnique({
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
        { error: 'Reposition task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /reposition-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reposition task' },
      { status: 500 }
    );
  }
}

// PUT - Update reposition task
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
      position,
      intactOrEpuapGrade,
      notes,
      photoUrl,
      completed,
      emotion
    } = body;

    const task = await prisma.repositionTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        position,
        intactOrEpuapGrade,
        notes: notes || null,
        photoUrl: photoUrl || null,
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
    console.error('PUT /reposition-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update reposition task' },
      { status: 500 }
    );
  }
}

// DELETE reposition task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.repositionTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Reposition task deleted successfully' });
  } catch (error) {
    console.error('DELETE /reposition-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reposition task' },
      { status: 500 }
    );
  }
}

