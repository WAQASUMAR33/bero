'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET all encouragement tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const tasks = await prisma.encouragementTask.findMany({
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
    console.error('GET /encouragement-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encouragement tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new encouragement task
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    const task = await prisma.encouragementTask.create({
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        encouragement,
        note: note || null,
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
    console.error('POST /encouragement-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create encouragement task' },
      { status: 500 }
    );
  }
}

