'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/shift-runs
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const shiftRuns = await prisma.shiftRun.findMany({
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(shiftRuns);
  } catch (error) {
    console.error('GET /shift-runs error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift runs' }, { status: 500 });
  }
}

// POST /api/shift-runs
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const shiftRun = await prisma.shiftRun.create({
      data: {
        name,
        description: description || null,
        createdById: decoded.userId,
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

    return NextResponse.json(shiftRun, { status: 201 });
  } catch (error) {
    console.error('POST /shift-runs error:', error);
    return NextResponse.json({ error: 'Failed to create shift run' }, { status: 500 });
  }
}
