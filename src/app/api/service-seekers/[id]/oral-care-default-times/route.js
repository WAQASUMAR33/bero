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

    const times = await prisma.serviceSeekerOralCareDefaultTime.findMany({
      where: { serviceSeekerId },
      orderBy: [{ hour: 'asc' }, { minute: 'asc' }],
    });

    return NextResponse.json(times || [], { status: 200 });
  } catch (e) {
    console.error('GET oral-care-default-times error:', e);
    return NextResponse.json({ error: 'Failed to fetch default times' }, { status: 500 });
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

    const b = await request.json();

    const created = await prisma.serviceSeekerOralCareDefaultTime.create({
      data: {
        serviceSeekerId,
        hour: b.hour || '',
        minute: b.minute || '',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST oral-care-default-times error:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'This time already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create default time' }, { status: 500 });
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

    await prisma.serviceSeekerOralCareDefaultTime.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE oral-care-default-times error:', e);
    return NextResponse.json({ error: 'Failed to delete default time' }, { status: 500 });
  }
}

