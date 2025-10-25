'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/blood-test-tasks/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const taskId = parseInt(id);
    
    const task = await prisma.bloodTestTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
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
    console.error('GET /blood-test-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch blood test task' }, { status: 500 });
  }
}

// PUT /api/blood-test-tasks/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();

    const updated = await prisma.bloodTestTask.update({
      where: { id: taskId },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        bloodGlucose: body.bloodGlucose ? parseFloat(body.bloodGlucose) : null,
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

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /blood-test-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update blood test task' }, { status: 500 });
  }
}

// DELETE /api/blood-test-tasks/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.bloodTestTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /blood-test-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete blood test task' }, { status: 500 });
  }
}

