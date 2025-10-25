'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single oral care task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.oralCareTask.findUnique({
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
        { error: 'Oral care task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oral care task' },
      { status: 500 }
    );
  }
}

// PUT - Update oral care task
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
      oralCare,
      assisted,
      notes,
      compliance,
      completed,
      emotion
    } = body;

    const task = await prisma.oralCareTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time: time || null,
        oralCare,
        assisted,
        notes: notes || null,
        compliance,
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
    console.error('PUT /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update oral care task' },
      { status: 500 }
    );
  }
}

// DELETE oral care task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.oralCareTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Oral care task deleted successfully' });
  } catch (error) {
    console.error('DELETE /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete oral care task' },
      { status: 500 }
    );
  }
}
