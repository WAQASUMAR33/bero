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

    const schedule = await prisma.serviceSeekerBathingSchedule.findUnique({
      where: { serviceSeekerId },
      include: { scheduleItems: true },
    });

    // Also fetch actual bathing tasks
    const tasks = await prisma.bathingTask.findMany({
      where: { serviceSeekerId },
      orderBy: { date: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ 
      schedule: schedule || { showerGelSoapShampoo: '', directions: '' }, 
      tasks 
    }, { status: 200 });
  } catch (e) {
    console.error('GET bathing-schedule error:', e);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
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
    
    const schedule = await prisma.serviceSeekerBathingSchedule.upsert({
      where: { serviceSeekerId },
      update: {
        showerGelSoapShampoo: b.showerGelSoapShampoo || null,
        directions: b.directions || null,
      },
      create: {
        serviceSeekerId,
        showerGelSoapShampoo: b.showerGelSoapShampoo || null,
        directions: b.directions || null,
      },
    });
    
    return NextResponse.json(schedule, { status: 200 });
  } catch (e) {
    console.error('POST bathing-schedule error:', e);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}

