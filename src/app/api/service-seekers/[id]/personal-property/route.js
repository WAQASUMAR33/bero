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
    const archived = searchParams.get('archived');
    const where = { serviceSeekerId, ...(archived ? { archived: archived === 'true' } : {}) };
    const rows = await prisma.serviceSeekerPersonalProperty.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET personal-property error:', e);
    return NextResponse.json({ error: 'Failed to fetch personal property' }, { status: 500 });
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
    const created = await prisma.serviceSeekerPersonalProperty.create({
      data: {
        serviceSeekerId,
        item: b.item,
        pictureUrl: b.pictureUrl || null,
        enteredBy: b.enteredBy || null,
        archived: b.archived === true || b.archived === 'true',
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST personal-property error:', e);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
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

    const row = await prisma.serviceSeekerPersonalProperty.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerPersonalProperty.update({ where: { id }, data: { archived: true } });
    return NextResponse.json({ message: 'Archived' }, { status: 200 });
  } catch (e) {
    console.error('DELETE personal-property error:', e);
    return NextResponse.json({ error: 'Failed to archive item' }, { status: 500 });
  }
}


