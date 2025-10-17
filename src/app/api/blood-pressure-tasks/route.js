'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/blood-pressure-tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const tasks = await prisma.bloodPressureTask.findMany({
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
    console.error('GET /blood-pressure-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch blood pressure tasks' }, { status: 500 });
  }
}

// POST /api/blood-pressure-tasks
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
      systolicPressure,
      diastolicPressure,
      notes,
      completed,
      emotion,
    } = body;

    if (!serviceSeekerId || !date || !time || !systolicPressure || !diastolicPressure || !completed || !emotion) {
      return NextResponse.json(
        { error: 'Required fields: serviceSeekerId, date, time, systolicPressure, diastolicPressure, completed, emotion' },
        { status: 400 }
      );
    }

    const created = await prisma.bloodPressureTask.create({
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        systolicPressure: parseInt(systolicPressure),
        diastolicPressure: parseInt(diastolicPressure),
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
    console.error('POST /blood-pressure-tasks error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create blood pressure task' }, { status: 500 });
  }
}

