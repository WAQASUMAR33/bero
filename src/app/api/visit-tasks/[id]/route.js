'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single visit task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;

    const task = await prisma.visitTask.findUnique({
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
        { error: 'Visit task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /visit-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visit task' },
      { status: 500 }
    );
  }
}

// PUT - Update visit task
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const body = await request.json();
    const {
      serviceSeekerId,
      date,
      time,
      visitType,
      announced,
      name,
      relationship,
      role,
      purpose,
      summary,
      completed
    } = body;

    const task = await prisma.visitTask.update({
      where: { id },
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        visitType,
        announced,
        name,
        relationship: relationship || null,
        role: role || null,
        purpose,
        summary: summary || null,
        completed,
        updatedById: decoded.userId
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
    console.error('PUT /visit-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update visit task' },
      { status: 500 }
    );
  }
}

// DELETE visit task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;

    await prisma.visitTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Visit task deleted successfully' });
  } catch (error) {
    console.error('DELETE /visit-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete visit task' },
      { status: 500 }
    );
  }
}

