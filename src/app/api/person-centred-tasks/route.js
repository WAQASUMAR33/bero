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

// GET all person centred tasks
export async function GET(request) {
  try {
    const tasks = await prisma.personCentredTask.findMany({
      include: {
        serviceSeeker: true,
        taskName: true,
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
    console.error('GET /person-centred-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person centred tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new person centred task
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
      nameId,
      notes,
      photoUrl,
      completed,
      emotion
    } = body;

    const task = await prisma.personCentredTask.create({
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        nameId,
        notes: notes || null,
        photoUrl: photoUrl || null,
        completed,
        emotion,
        createdById: user.userId,
        updatedById: user.userId
      },
      include: {
        serviceSeeker: true,
        taskName: true,
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
    console.error('POST /person-centred-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create person centred task' },
      { status: 500 }
    );
  }
}

