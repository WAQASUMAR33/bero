'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/shift-runs/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftRunId = parseInt(id);
    const shiftRun = await prisma.shiftRun.findUnique({
      where: { id: shiftRunId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!shiftRun) {
      return NextResponse.json({ error: 'Shift run not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: shiftRun
    });
  } catch (error) {
    console.error('GET /shift-runs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift run' }, { status: 500 });
  }
}

// PUT /api/shift-runs/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftRunId = parseInt(id);
    const body = await request.json();
    const { name, description } = body;

    const shiftRun = await prisma.shiftRun.update({
      where: { id: shiftRunId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        updatedById: decoded.userId
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: shiftRun
    });
  } catch (error) {
    console.error('PUT /shift-runs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update shift run' }, { status: 500 });
  }
}

// DELETE /api/shift-runs/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftRunId = parseInt(id);
    await prisma.shiftRun.delete({
      where: { id: shiftRunId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Shift run deleted successfully' 
    });
  } catch (error) {
    console.error('DELETE /shift-runs/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete shift run' }, { status: 500 });
  }
}
