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

    if (!prisma.serviceSeekerHealthTag) {
      console.warn('Prisma client missing model ServiceSeekerHealthTag. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const healthTags = await prisma.serviceSeekerHealthTag.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(healthTags || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/health-tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch health tags' }, { status: 500 });
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
    const { tagName, isCustom } = body;

    if (!tagName || !tagName.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerHealthTag) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    // Check if tag already exists for this service seeker
    const existing = await prisma.serviceSeekerHealthTag.findFirst({
      where: { 
        serviceSeekerId,
        tagName: tagName.trim()
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'This health tag already exists' }, { status: 400 });
    }

    const created = await prisma.serviceSeekerHealthTag.create({
      data: {
        serviceSeekerId,
        tagName: tagName.trim(),
        isCustom: isCustom || false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/health-tags error:', error);
    return NextResponse.json({ error: 'Failed to create health tag' }, { status: 500 });
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
    const tagId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(tagId)) return NextResponse.json({ error: 'Invalid health tag ID' }, { status: 400 });

    if (!prisma.serviceSeekerHealthTag) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const tag = await prisma.serviceSeekerHealthTag.findFirst({
      where: { id: tagId, serviceSeekerId },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Health tag not found' }, { status: 404 });
    }

    await prisma.serviceSeekerHealthTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: 'Health tag deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/health-tags error:', error);
    return NextResponse.json({ error: 'Failed to delete health tag' }, { status: 500 });
  }
}

