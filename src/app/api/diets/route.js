'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!prisma.diet) {
      console.warn('Prisma client missing model Diet. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }

    const diets = await prisma.diet.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(diets || [], { status: 200 });
  } catch (error) {
    console.error('GET /diets error:', error);
    return NextResponse.json({ error: 'Failed to fetch diets' }, { status: 500 });
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
      return NextResponse.json({ error: 'Diet name is required' }, { status: 400 });
    }

    if (!prisma.diet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.diet.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /diets error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Diet name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create diet' }, { status: 500 });
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
      return NextResponse.json({ error: 'Diet name is required' }, { status: 400 });
    }

    if (!prisma.diet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.diet.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Diet not found' }, { status: 404 });
    }

    const updated = await prisma.diet.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /diets error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Diet name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update diet' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const dietId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(dietId)) return NextResponse.json({ error: 'Invalid diet ID' }, { status: 400 });

    if (!prisma.diet) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const diet = await prisma.diet.findUnique({
      where: { id: dietId },
    });

    if (!diet) {
      return NextResponse.json({ error: 'Diet not found' }, { status: 404 });
    }

    await prisma.diet.delete({
      where: { id: dietId },
    });

    return NextResponse.json({ message: 'Diet deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /diets error:', error);
    return NextResponse.json({ error: 'Failed to delete diet' }, { status: 500 });
  }
}

