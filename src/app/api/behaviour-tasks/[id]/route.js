'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/behaviour-tasks/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    
    const task = await prisma.behaviourTask.findUnique({
      where: { id },
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
    });
    
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('GET /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch behaviour task' }, { status: 500 });
  }
}

// PUT /api/behaviour-tasks/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.behaviourTask.update({
      where: { id },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
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

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update behaviour task' }, { status: 500 });
  }
}

// DELETE /api/behaviour-tasks/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;

    await prisma.behaviourTask.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete behaviour task' }, { status: 500 });
  }
}

