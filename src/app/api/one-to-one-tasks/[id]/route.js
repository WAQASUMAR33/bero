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

// GET single one-to-one task
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const task = await prisma.oneToOneTask.findUnique({
      where: { id },
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
        { error: 'One-to-one task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /one-to-one-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch one-to-one task' },
      { status: 500 }
    );
  }
}

// PUT - Update one-to-one task
export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      serviceSeekerId,
      date,
      time,
      duration,
      notes,
      emotion
    } = body;

    const task = await prisma.oneToOneTask.update({
      where: { id },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        duration,
        notes: notes || '',
        emotion,
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

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /one-to-one-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update one-to-one task' },
      { status: 500 }
    );
  }
}

// DELETE one-to-one task
export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.oneToOneTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'One-to-one task deleted successfully' });
  } catch (error) {
    console.error('DELETE /one-to-one-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete one-to-one task' },
      { status: 500 }
    );
  }
}

