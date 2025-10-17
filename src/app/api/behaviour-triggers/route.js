'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/behaviour-triggers
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const triggers = await prisma.behaviourTrigger.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(triggers, { status: 200 });
  } catch (error) {
    console.error('GET /behaviour-triggers error:', error);
    return NextResponse.json({ error: 'Failed to fetch behaviour triggers' }, { status: 500 });
  }
}

// POST /api/behaviour-triggers
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();
    
    const { name, define } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if trigger already exists
    const existing = await prisma.behaviourTrigger.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'A trigger with this name already exists' }, { status: 409 });
    }

    const created = await prisma.behaviourTrigger.create({
      data: {
        name,
        define: define || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /behaviour-triggers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create behaviour trigger' }, { status: 500 });
  }
}

