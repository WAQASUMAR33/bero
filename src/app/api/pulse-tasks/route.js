'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET all pulse tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const tasks = await prisma.pulseTask.findMany({
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /pulse-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pulse tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new pulse task
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const {
      serviceSeekerId: parseInt(serviceSeekerId),
      date,
      time,
      pulseRate,
      notes,
      completed,
      emotion
    } = body;

    const task = await prisma.pulseTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        pulseRate: parseInt(pulseRate),
        notes: notes || null,
        completed,
        emotion,
        createdById: decoded.userId,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /pulse-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create pulse task' },
      { status: 500 }
    );
  }
}

