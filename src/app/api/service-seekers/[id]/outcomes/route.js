'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = { serviceSeekerId, ...(category ? { category } : {}) };
    const rows = await prisma.serviceSeekerOutcome.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET outcomes error:', e);
    return NextResponse.json({ error: 'Failed to fetch outcomes' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const created = await prisma.serviceSeekerOutcome.create({
      data: {
        serviceSeekerId,
        category: body.category,
        data: body.data,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST outcomes error:', e);
    return NextResponse.json({ error: 'Failed to create outcome' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const row = await prisma.serviceSeekerOutcome.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Outcome not found' }, { status: 404 });

    await prisma.serviceSeekerOutcome.delete({ where: { id } });
    return NextResponse.json({ message: 'Outcome deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE outcomes error:', e);
    return NextResponse.json({ error: 'Failed to delete outcome' }, { status: 500 });
  }
}


