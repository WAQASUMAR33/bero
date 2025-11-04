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

    if (!prisma.serviceSeekerOtherId) {
      console.warn('Prisma client missing model ServiceSeekerOtherId. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const otherIds = await prisma.serviceSeekerOtherId.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(otherIds || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/other-ids error:', error);
    return NextResponse.json({ error: 'Failed to fetch other IDs' }, { status: 500 });
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
    const { idName, idNumber } = body;

    if (!idName || !idNumber) {
      return NextResponse.json({ error: 'ID name and ID number are required' }, { status: 400 });
    }

    // Ensure service seeker exists
    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerOtherId) {
      console.warn('Prisma client missing model ServiceSeekerOtherId. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.serviceSeekerOtherId.create({
      data: {
        serviceSeekerId,
        idName: idName.trim(),
        idNumber: idNumber.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/other-ids error:', error);
    return NextResponse.json({ error: 'Failed to create other ID' }, { status: 500 });
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
    const { id, idName, idNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!idName || !idNumber) {
      return NextResponse.json({ error: 'ID name and ID number are required' }, { status: 400 });
    }

    if (!prisma.serviceSeekerOtherId) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    // Verify the other ID belongs to this service seeker
    const existing = await prisma.serviceSeekerOtherId.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Other ID not found' }, { status: 404 });
    }

    const updated = await prisma.serviceSeekerOtherId.update({
      where: { id: parseInt(id, 10) },
      data: {
        idName: idName.trim(),
        idNumber: idNumber.trim(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/other-ids error:', error);
    return NextResponse.json({ error: 'Failed to update other ID' }, { status: 500 });
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
    const otherIdId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(otherIdId)) return NextResponse.json({ error: 'Invalid other ID' }, { status: 400 });

    if (!prisma.serviceSeekerOtherId) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    // Verify the other ID belongs to this service seeker
    const otherId = await prisma.serviceSeekerOtherId.findFirst({
      where: { id: otherIdId, serviceSeekerId },
    });

    if (!otherId) {
      return NextResponse.json({ error: 'Other ID not found' }, { status: 404 });
    }

    await prisma.serviceSeekerOtherId.delete({
      where: { id: otherIdId },
    });

    return NextResponse.json({ message: 'Other ID deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/other-ids error:', error);
    return NextResponse.json({ error: 'Failed to delete other ID' }, { status: 500 });
  }
}

