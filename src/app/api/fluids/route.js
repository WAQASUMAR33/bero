'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const DEFAULT_FLUIDS = [
  'Water',
  'Tea',
  'Coffee',
  'Fruit Juice',
  'Milk',
  'Squash / Cordial',
  'Thickened Fluid (Level 1)',
  'Thickened Fluid (Level 2)',
  'Thickened Fluid (Level 3)',
  'Nutritional Supplement Drink',
];

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!prisma.fluid) {
      console.warn('Prisma client missing model Fluid. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }

    let fluids = await prisma.fluid.findMany({
      orderBy: { name: 'asc' },
    });

    if (fluids.length === 0) {
      for (const name of DEFAULT_FLUIDS) {
        try {
          await prisma.fluid.create({ data: { name } });
        } catch {
          // Ignore duplicate if already created
        }
      }
      fluids = await prisma.fluid.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(fluids || [], { status: 200 });
  } catch (error) {
    console.error('GET /fluids error:', error);
    return NextResponse.json({ error: 'Failed to fetch fluids' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Fluid name is required' }, { status: 400 });
    }

    if (!prisma.fluid) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.fluid.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /fluids error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Fluid name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create fluid' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Fluid name is required' }, { status: 400 });
    }

    if (!prisma.fluid) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.fluid.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fluid not found' }, { status: 404 });
    }

    const updated = await prisma.fluid.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /fluids error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Fluid name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update fluid' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const fluidId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(fluidId)) return NextResponse.json({ error: 'Invalid fluid ID' }, { status: 400 });

    if (!prisma.fluid) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const fluid = await prisma.fluid.findUnique({
      where: { id: fluidId },
    });

    if (!fluid) {
      return NextResponse.json({ error: 'Fluid not found' }, { status: 404 });
    }

    await prisma.fluid.delete({
      where: { id: fluidId },
    });

    return NextResponse.json({ message: 'Fluid deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /fluids error:', error);
    return NextResponse.json({ error: 'Failed to delete fluid' }, { status: 500 });
  }
}
