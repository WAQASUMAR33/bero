'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET /api/bathing-tasks
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
    
    const tasks = await prisma.bathingTask.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('GET /bathing-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch bathing tasks' }, { status: 500 });
  }
}

// POST /api/bathing-tasks
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
      bathingType,
      compliance,
      stoolPassed,
      urinePassed,
      bathNotes,
      catheterChecked,
      completed,
      emotion,
    } = body;

    if (!serviceSeekerId || !date || !time || !bathingType || !compliance || !completed || !emotion) {
      return NextResponse.json(
        { error: 'Required fields: serviceSeekerId, date, time, bathingType, compliance, completed, emotion' },
        { status: 400 }
      );
    }

    const created = await prisma.bathingTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        bathingType,
        compliance,
        stoolPassed: typeof stoolPassed === 'boolean' ? stoolPassed : false,
        urinePassed: typeof urinePassed === 'boolean' ? urinePassed : false,
        bathNotes: bathNotes || null,
        catheterChecked: typeof catheterChecked === 'boolean' ? catheterChecked : false,
        completed,
        emotion,
        createdById: decoded.userId,
        updatedById: decoded.userId,
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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /bathing-tasks error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create bathing task' }, { status: 500 });
  }
}

