'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/comfort-check-tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const tasks = await prisma.comfortCheckTask.findMany({
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
    console.error('GET /comfort-check-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch comfort check tasks' }, { status: 500 });
  }
}

// POST /api/comfort-check-tasks
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
      allNeedsMet,
      catheterCheck,
      incontinencePadCheck,
      personalHygiene,
      repositioned,
      sleep,
      stomaCheck,
      toileted,
      stoolPassed,
      urinePassed,
      notes,
      completed,
      emotion,
    } = body;

    if (!serviceSeekerId || !date || !time || !completed || !emotion) {
      return NextResponse.json(
        { error: 'Required fields: serviceSeekerId: parseInt(serviceSeekerId), date, time, completed, emotion' },
        { status: 400 }
      );
    }

    const created = await prisma.comfortCheckTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        allNeedsMet: typeof allNeedsMet === 'boolean' ? allNeedsMet : false,
        catheterCheck: typeof catheterCheck === 'boolean' ? catheterCheck : false,
        incontinencePadCheck: typeof incontinencePadCheck === 'boolean' ? incontinencePadCheck : false,
        personalHygiene: typeof personalHygiene === 'boolean' ? personalHygiene : false,
        repositioned: typeof repositioned === 'boolean' ? repositioned : false,
        sleep: typeof sleep === 'boolean' ? sleep : false,
        stomaCheck: typeof stomaCheck === 'boolean' ? stomaCheck : false,
        toileted: typeof toileted === 'boolean' ? toileted : false,
        stoolPassed: typeof stoolPassed === 'boolean' ? stoolPassed : false,
        urinePassed: typeof urinePassed === 'boolean' ? urinePassed : false,
        notes: notes || null,
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
    console.error('POST /comfort-check-tasks error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create comfort check task' }, { status: 500 });
  }
}

