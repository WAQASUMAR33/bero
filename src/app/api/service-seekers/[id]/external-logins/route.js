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

    const rows = await prisma.serviceSeekerExternalLogin.findMany({
      where: { serviceSeekerId },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET external-logins error:', e);
    return NextResponse.json({ error: 'Failed to fetch external logins' }, { status: 500 });
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
    const created = await prisma.serviceSeekerExternalLogin.create({
      data: {
        serviceSeekerId,
        profileId: parseInt(b.profileId, 10),
        showRota: b.showRota === true || b.showRota === 'true',
        showAllowance: b.showAllowance === true || b.showAllowance === 'true',
        showCarePlan: b.showCarePlan === true || b.showCarePlan === 'true',
        showDailyNotes: b.showDailyNotes === true || b.showDailyNotes === 'true',
        showMarChart: b.showMarChart === true || b.showMarChart === 'true',
      },
      include: { profile: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST external-logins error:', e);
    return NextResponse.json({ error: 'Failed to create external login' }, { status: 500 });
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

    const row = await prisma.serviceSeekerExternalLogin.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerExternalLogin.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE external-logins error:', e);
    return NextResponse.json({ error: 'Failed to delete external login' }, { status: 500 });
  }
}


