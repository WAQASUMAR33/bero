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

    const rows = await prisma.serviceSeekerResidentMeeting.findMany({ where: { serviceSeekerId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET resident-meetings error:', e);
    return NextResponse.json({ error: 'Failed to fetch resident meetings' }, { status: 500 });
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
    const created = await prisma.serviceSeekerResidentMeeting.create({
      data: {
        serviceSeekerId,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(),
        chairedBy: body.chairedBy?.trim() || null,
        about: body.about?.trim() || null,
        notes: body.notes?.trim() || null,
        actions: body.actions?.trim() || null,
        concerns: body.concerns?.trim() || null,
        invites: Array.isArray(body.invites) ? body.invites : [],
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST resident-meetings error:', e);
    return NextResponse.json({ error: 'Failed to create resident meeting' }, { status: 500 });
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

    const row = await prisma.serviceSeekerResidentMeeting.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Resident meeting not found' }, { status: 404 });

    await prisma.serviceSeekerResidentMeeting.delete({ where: { id } });
    return NextResponse.json({ message: 'Resident meeting deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE resident-meetings error:', e);
    return NextResponse.json({ error: 'Failed to delete resident meeting' }, { status: 500 });
  }
}


