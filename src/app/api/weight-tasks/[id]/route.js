'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single weight task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.weightTask.findUnique({
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
        { error: 'Weight task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /weight-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight task' },
      { status: 500 }
    );
  }
}

// PUT - Update weight task
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
      weight,
      notes,
      completed,
      emotion
    } = body;

    const task = await prisma.weightTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        weight: parseFloat(weight),
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
    console.error('PUT /weight-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update weight task' },
      { status: 500 }
    );
  }
}

// DELETE weight task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.weightTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Weight task deleted successfully' });
  } catch (error) {
    console.error('DELETE /weight-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete weight task' },
      { status: 500 }
    );
  }
}

