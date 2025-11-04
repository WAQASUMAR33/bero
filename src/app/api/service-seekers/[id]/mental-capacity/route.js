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

    if (!prisma.serviceSeekerMentalCapacity) {
      console.warn('Prisma client missing model ServiceSeekerMentalCapacity. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const mentalCapacities = await prisma.serviceSeekerMentalCapacity.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(mentalCapacities || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/mental-capacity error:', error);
    return NextResponse.json({ error: 'Failed to fetch mental capacity records' }, { status: 500 });
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
    const {
      mca,
      capacity,
      bestInterests,
      score,
      dols,
      appliedForDate,
      dolsStartDate,
      dolsEndDate,
      dolsNotes,
      cqcInformed,
      dolsAppliedForDate,
    } = body;

    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerMentalCapacity) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.serviceSeekerMentalCapacity.create({
      data: {
        serviceSeekerId,
        mca: mca ? new Date(mca) : null,
        capacity: capacity?.trim() || null,
        bestInterests: bestInterests?.trim() || null,
        score: score?.trim() || null,
        dols: dols || null,
        appliedForDate: appliedForDate ? new Date(appliedForDate) : null,
        dolsStartDate: dolsStartDate ? new Date(dolsStartDate) : null,
        dolsEndDate: dolsEndDate ? new Date(dolsEndDate) : null,
        dolsNotes: dolsNotes?.trim() || null,
        cqcInformed: cqcInformed === true || cqcInformed === 'true',
        dolsAppliedForDate: dolsAppliedForDate ? new Date(dolsAppliedForDate) : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/mental-capacity error:', error);
    return NextResponse.json({ error: 'Failed to create mental capacity record' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const {
      id,
      mca,
      capacity,
      bestInterests,
      score,
      dols,
      appliedForDate,
      dolsStartDate,
      dolsEndDate,
      dolsNotes,
      cqcInformed,
      dolsAppliedForDate,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!prisma.serviceSeekerMentalCapacity) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.serviceSeekerMentalCapacity.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Mental capacity record not found' }, { status: 404 });
    }

    const updated = await prisma.serviceSeekerMentalCapacity.update({
      where: { id: parseInt(id, 10) },
      data: {
        mca: mca ? new Date(mca) : null,
        capacity: capacity?.trim() || null,
        bestInterests: bestInterests?.trim() || null,
        score: score?.trim() || null,
        dols: dols || null,
        appliedForDate: appliedForDate ? new Date(appliedForDate) : null,
        dolsStartDate: dolsStartDate ? new Date(dolsStartDate) : null,
        dolsEndDate: dolsEndDate ? new Date(dolsEndDate) : null,
        dolsNotes: dolsNotes?.trim() || null,
        cqcInformed: cqcInformed === true || cqcInformed === 'true',
        dolsAppliedForDate: dolsAppliedForDate ? new Date(dolsAppliedForDate) : null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/mental-capacity error:', error);
    return NextResponse.json({ error: 'Failed to update mental capacity record' }, { status: 500 });
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
    const capacityId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(capacityId)) return NextResponse.json({ error: 'Invalid mental capacity ID' }, { status: 400 });

    if (!prisma.serviceSeekerMentalCapacity) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const capacity = await prisma.serviceSeekerMentalCapacity.findFirst({
      where: { id: capacityId, serviceSeekerId },
    });

    if (!capacity) {
      return NextResponse.json({ error: 'Mental capacity record not found' }, { status: 404 });
    }

    await prisma.serviceSeekerMentalCapacity.delete({
      where: { id: capacityId },
    });

    return NextResponse.json({ message: 'Mental capacity record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/mental-capacity error:', error);
    return NextResponse.json({ error: 'Failed to delete mental capacity record' }, { status: 500 });
  }
}

