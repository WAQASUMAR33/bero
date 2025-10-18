import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET all oxygen tasks
export async function GET(request) {
  try {
    const tasks = await prisma.oxygenTask.findMany({
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
    console.error('GET /oxygen-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oxygen tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new oxygen task
export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      serviceSeekerId,
      date,
      time,
      quantity,
      notes,
      completed,
      emotion
    } = body;

    const task = await prisma.oxygenTask.create({
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        quantity,
        notes: notes || null,
        completed,
        emotion,
        createdById: user.userId,
        updatedById: user.userId
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
    console.error('POST /oxygen-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create oxygen task' },
      { status: 500 }
    );
  }
}

