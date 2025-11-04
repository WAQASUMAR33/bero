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

    const accessCodes = await prisma.serviceSeekerMedicineAccessCodes.findUnique({
      where: { serviceSeekerId },
    });
    
    return NextResponse.json(accessCodes || { accessCodes: '' }, { status: 200 });
  } catch (e) {
    console.error('GET medicine-access-codes error:', e);
    return NextResponse.json({ error: 'Failed to fetch access codes' }, { status: 500 });
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
    
    const accessCodes = await prisma.serviceSeekerMedicineAccessCodes.upsert({
      where: { serviceSeekerId },
      update: {
        accessCodes: b.accessCodes || null,
      },
      create: {
        serviceSeekerId,
        accessCodes: b.accessCodes || null,
      },
    });
    
    return NextResponse.json(accessCodes, { status: 200 });
  } catch (e) {
    console.error('POST medicine-access-codes error:', e);
    return NextResponse.json({ error: 'Failed to save access codes' }, { status: 500 });
  }
}

