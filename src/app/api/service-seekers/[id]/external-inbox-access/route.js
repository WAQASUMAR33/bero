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

    const rows = await prisma.serviceSeekerExternalInboxAccess.findMany({ where: { serviceSeekerId } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET external-inbox-access error:', e);
    return NextResponse.json({ error: 'Failed to fetch access list' }, { status: 500 });
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

    const b = await request.json(); // { userIds: number[] }
    const userIds = Array.isArray(b.userIds) ? b.userIds.map((x)=>parseInt(x,10)).filter(n=>!Number.isNaN(n)) : [];

    // Replace existing
    await prisma.serviceSeekerExternalInboxAccess.deleteMany({ where: { serviceSeekerId } });
    if (userIds.length > 0) {
      await prisma.serviceSeekerExternalInboxAccess.createMany({ data: userIds.map(userId => ({ serviceSeekerId, userId })) });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('POST external-inbox-access error:', e);
    return NextResponse.json({ error: 'Failed to save access list' }, { status: 500 });
  }
}


