'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const DEFAULT_SPECIAL_DIETS = [
  'N/A',
  'Pure Food',
  'Soft Food',
  'Food Thickener',
  'Nutritional Supplement'
];

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!prisma.specialDiet) {
      console.warn('Prisma client missing model SpecialDiet. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }

    let specialDiets = await prisma.specialDiet.findMany({
      orderBy: { name: 'asc' },
    });

    // Auto-seed default options if table is empty
    if (specialDiets.length === 0) {
      for (const name of DEFAULT_SPECIAL_DIETS) {
        try {
          await prisma.specialDiet.create({ data: { name } });
        } catch (_) {}
      }
      specialDiets = await prisma.specialDiet.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(specialDiets || [], { status: 200 });
  } catch (error) {
    console.error('GET /special-diets error:', error);
    return NextResponse.json({ error: 'Failed to fetch special diets' }, { status: 500 });
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
      return NextResponse.json({ error: 'Special diet name is required' }, { status: 400 });
    }

    if (!prisma.specialDiet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.specialDiet.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /special-diets error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Special diet name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create special diet' }, { status: 500 });
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
      return NextResponse.json({ error: 'Special diet name is required' }, { status: 400 });
    }

    if (!prisma.specialDiet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.specialDiet.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Special diet not found' }, { status: 404 });
    }

    const updated = await prisma.specialDiet.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /special-diets error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Special diet name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update special diet' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const specialDietId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(specialDietId)) return NextResponse.json({ error: 'Invalid special diet ID' }, { status: 400 });

    if (!prisma.specialDiet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const specialDiet = await prisma.specialDiet.findUnique({
      where: { id: specialDietId },
    });

    if (!specialDiet) {
      return NextResponse.json({ error: 'Special diet not found' }, { status: 404 });
    }

    await prisma.specialDiet.delete({
      where: { id: specialDietId },
    });

    return NextResponse.json({ message: 'Special diet deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /special-diets error:', error);
    return NextResponse.json({ error: 'Failed to delete special diet' }, { status: 500 });
  }
}
