'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET all observation tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const dateParam = searchParams.get('date');
    
    const where = {};
    if (serviceSeekerId) {
      where.serviceSeekerId = parseInt(serviceSeekerId);
    }
    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: date,
        lt: nextDay
      };
    }

    const tasks = await prisma.observationTask.findMany({
      where,
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
    console.error('GET /observation-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observation tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new observation task
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
      notes,
      emotion
    } = body;

    const task = await prisma.observationTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        notes,
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
    console.error('POST /observation-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create observation task' },
      { status: 500 }
    );
  }
}
