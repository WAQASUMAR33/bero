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

// GET single oxygen task
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const task = await prisma.oxygenTask.findUnique({
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
        { error: 'Oxygen task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oxygen task' },
      { status: 500 }
    );
  }
}

// PUT - Update oxygen task
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
      quantity,
      notes,
      completed,
      emotion
    } = body;

    const task = await prisma.oxygenTask.update({
      where: { id },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        quantity,
        notes: notes || null,
        completed,
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
    console.error('PUT /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update oxygen task' },
      { status: 500 }
    );
  }
}

// DELETE oxygen task
export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.oxygenTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Oxygen task deleted successfully' });
  } catch (error) {
    console.error('DELETE /oxygen-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete oxygen task' },
      { status: 500 }
    );
  }
}

