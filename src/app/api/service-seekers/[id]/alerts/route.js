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

    const existing = await prisma.serviceSeekerAlertThreshold.findFirst({ where: { serviceSeekerId }, orderBy: { updatedAt: 'desc' } });
    return NextResponse.json(existing || null, { status: 200 });
  } catch (e) {
    console.error('GET alerts error:', e);
    return NextResponse.json({ error: 'Failed to fetch alert thresholds' }, { status: 500 });
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
    const existing = await prisma.serviceSeekerAlertThreshold.findFirst({ where: { serviceSeekerId } });

    let saved;
    if (existing) {
      saved = await prisma.serviceSeekerAlertThreshold.update({
        where: { id: existing.id },
        data: {
          maxBloodGlucose: body.maxBloodGlucose || null,
          minBloodGlucose: body.minBloodGlucose || null,
          maxInsulin: body.maxInsulin || null,
          minInsulin: body.minInsulin || null,
          maxFood: body.maxFood || null,
          minFood: body.minFood || null,
          maxUrine: body.maxUrine || null,
          minUrine: body.minUrine || null,
        },
      });
    } else {
      saved = await prisma.serviceSeekerAlertThreshold.create({
        data: {
          serviceSeekerId,
          maxBloodGlucose: body.maxBloodGlucose || null,
          minBloodGlucose: body.minBloodGlucose || null,
          maxInsulin: body.maxInsulin || null,
          minInsulin: body.minInsulin || null,
          maxFood: body.maxFood || null,
          minFood: body.minFood || null,
          maxUrine: body.maxUrine || null,
          minUrine: body.minUrine || null,
        },
      });
    }
    return NextResponse.json(saved, { status: 200 });
  } catch (e) {
    console.error('POST alerts error:', e);
    return NextResponse.json({ error: 'Failed to save alert thresholds' }, { status: 500 });
  }
}


