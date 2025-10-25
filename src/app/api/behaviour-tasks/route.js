'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/behaviour-tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const tasks = await prisma.behaviourTask.findMany({
      include: {
        serviceSeeker: true,
        trigger: true,
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
    console.error('GET /behaviour-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch behaviour tasks' }, { status: 500 });
  }
}

// POST /api/behaviour-tasks
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
      type,
      triggerId,
      othersInvolved,
      othersInvolvedDetails,
      antecedents,
      behaviour,
      consequences,
      careIntervention,
      emotion,
    } = body;

    if (!serviceSeekerId || !date || !time || !type || !triggerId || !emotion) {
      return NextResponse.json(
        { error: 'Required fields: serviceSeekerId, date, time, type, triggerId, emotion' },
        { status: 400 }
      );
    }

    const created = await prisma.behaviourTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        type,
        triggerId,
        othersInvolved: typeof othersInvolved === 'boolean' ? othersInvolved : false,
        othersInvolvedDetails: othersInvolvedDetails || null,
        antecedents: antecedents || null,
        behaviour: behaviour || null,
        consequences: consequences || null,
        careIntervention: careIntervention || null,
        emotion,
        createdById: decoded.userId,
        updatedById: decoded.userId,
      },
      include: {
        serviceSeeker: true,
        trigger: true,
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
    console.error('POST /behaviour-tasks error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create behaviour task' }, { status: 500 });
  }
}

