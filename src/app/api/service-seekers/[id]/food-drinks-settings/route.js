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

    const settings = await prisma.serviceSeekerFoodDrinksSettings.findUnique({
      where: { serviceSeekerId },
    });

    // Also fetch actual food/drink tasks
    const tasks = await prisma.foodDrinkTask.findMany({
      where: { serviceSeekerId },
      orderBy: { date: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ 
      settings: settings || { pegMonitoring: false }, 
      tasks 
    }, { status: 200 });
  } catch (e) {
    console.error('GET food-drinks-settings error:', e);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
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
    
    const settings = await prisma.serviceSeekerFoodDrinksSettings.upsert({
      where: { serviceSeekerId },
      update: {
        pegMonitoring: b.pegMonitoring || false,
      },
      create: {
        serviceSeekerId,
        pegMonitoring: b.pegMonitoring || false,
      },
    });
    
    return NextResponse.json(settings, { status: 200 });
  } catch (e) {
    console.error('POST food-drinks-settings error:', e);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

