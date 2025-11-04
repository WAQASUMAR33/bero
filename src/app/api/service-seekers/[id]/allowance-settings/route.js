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

    const settings = await prisma.serviceSeekerAllowanceSettings.findUnique({
      where: { serviceSeekerId },
    });
    
    return NextResponse.json(settings || { receivesAllowance: false, allowanceAmount: 0, allowanceFrequency: null }, { status: 200 });
  } catch (e) {
    console.error('GET allowance-settings error:', e);
    return NextResponse.json({ error: 'Failed to fetch allowance settings' }, { status: 500 });
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
    
    const settings = await prisma.serviceSeekerAllowanceSettings.upsert({
      where: { serviceSeekerId },
      update: {
        receivesAllowance: b.receivesAllowance === true || b.receivesAllowance === 'true',
        allowanceAmount: b.allowanceAmount ? parseFloat(b.allowanceAmount) : 0,
        allowanceFrequency: b.allowanceFrequency || null,
      },
      create: {
        serviceSeekerId,
        receivesAllowance: b.receivesAllowance === true || b.receivesAllowance === 'true',
        allowanceAmount: b.allowanceAmount ? parseFloat(b.allowanceAmount) : 0,
        allowanceFrequency: b.allowanceFrequency || null,
      },
    });
    
    return NextResponse.json(settings, { status: 200 });
  } catch (e) {
    console.error('POST allowance-settings error:', e);
    return NextResponse.json({ error: 'Failed to save allowance settings' }, { status: 500 });
  }
}

