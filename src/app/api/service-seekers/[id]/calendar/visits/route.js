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

    const rows = await prisma.visitTask.findMany({ where: { serviceSeekerId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET visits error:', e);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
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
    const created = await prisma.visitTask.create({
      data: {
        serviceSeekerId,
        date: body.date ? new Date(body.date) : new Date(),
        time: body.time || '00:00',
        visitType: body.visitType, // FAMILY or PROFESSIONAL
        announced: body.announced === 'Yes' ? 'YES' : 'NO',
        name: body.name?.trim() || '',
        relationship: body.relationship || null,
        role: body.role || null,
        purpose: body.purpose?.trim() || '',
        summary: body.summary?.trim() || null,
        completed: body.completed === 'Yes' ? 'YES' : 'NO',
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST visits error:', e);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
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

    const row = await prisma.visitTask.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

    await prisma.visitTask.delete({ where: { id } });
    return NextResponse.json({ message: 'Visit deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE visits error:', e);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}


