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

    const rows = await prisma.serviceSeekerWaterlowAssessment.findMany({ where: { serviceSeekerId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET waterlow error:', e);
    return NextResponse.json({ error: 'Failed to fetch waterlow assessments' }, { status: 500 });
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
    const created = await prisma.serviceSeekerWaterlowAssessment.create({
      data: {
        serviceSeekerId,
        assessedOn: b.assessedOn ? new Date(b.assessedOn) : null,
        currentWeightKg: b.currentWeightKg ? parseFloat(b.currentWeightKg) : null,
        heightM: b.heightM ? parseFloat(b.heightM) : null,
        previousWeightKg: b.previousWeightKg ? parseFloat(b.previousWeightKg) : null,
        continence: b.continence || null,
        skinType: b.skinType || null,
        mobility: b.mobility || null,
        specialSurgeryTrauma: b.specialSurgeryTrauma || null,
        specialTissue: b.specialTissue || [],
        specialNeuro: b.specialNeuro || [],
        specialMedication: b.specialMedication || [],
        photos: b.photos || [],
        score: b.score || null,
        riskLevel: b.riskLevel || null,
        conductedBy: b.conductedBy || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST waterlow error:', e);
    return NextResponse.json({ error: 'Failed to create waterlow assessment' }, { status: 500 });
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

    const row = await prisma.serviceSeekerWaterlowAssessment.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerWaterlowAssessment.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE waterlow error:', e);
    return NextResponse.json({ error: 'Failed to delete waterlow assessment' }, { status: 500 });
  }
}


