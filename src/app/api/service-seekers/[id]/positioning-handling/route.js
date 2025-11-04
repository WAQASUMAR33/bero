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

    const rows = await prisma.serviceSeekerPositioningHandling.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET positioning-handling error:', e);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
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
    
    const created = await prisma.serviceSeekerPositioningHandling.create({
      data: {
        serviceSeekerId,
        position: b.position || null,
        skinIntactOrGrade: b.skinIntactOrGrade || null,
        times: b.times || [],
        frequency: b.frequency || '',
        team: b.team || 'All',
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST positioning-handling error:', e);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const b = await request.json();
    const id = parseInt(b.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const updated = await prisma.serviceSeekerPositioningHandling.update({
      where: { id },
      data: {
        position: b.position || null,
        skinIntactOrGrade: b.skinIntactOrGrade || null,
        times: b.times || [],
        frequency: b.frequency || '',
        team: b.team || 'All',
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT positioning-handling error:', e);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
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

    const row = await prisma.serviceSeekerPositioningHandling.findFirst({
      where: { id, serviceSeekerId },
    });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerPositioningHandling.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE positioning-handling error:', e);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}

