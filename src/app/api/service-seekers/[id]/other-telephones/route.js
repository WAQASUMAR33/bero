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

    if (!prisma.serviceSeekerOtherTelephone) {
      console.warn('Prisma client missing model ServiceSeekerOtherTelephone. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const otherTelephones = await prisma.serviceSeekerOtherTelephone.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(otherTelephones || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/other-telephones error:', error);
    return NextResponse.json({ error: 'Failed to fetch other telephones' }, { status: 500 });
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
    const { telephoneType, number } = body;

    if (!telephoneType || !number) {
      return NextResponse.json({ error: 'Telephone type and number are required' }, { status: 400 });
    }

    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerOtherTelephone) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.serviceSeekerOtherTelephone.create({
      data: {
        serviceSeekerId,
        telephoneType: telephoneType.trim(),
        number: number.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/other-telephones error:', error);
    return NextResponse.json({ error: 'Failed to create other telephone' }, { status: 500 });
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
    const { id, telephoneType, number } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!telephoneType || !number) {
      return NextResponse.json({ error: 'Telephone type and number are required' }, { status: 400 });
    }

    if (!prisma.serviceSeekerOtherTelephone) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.serviceSeekerOtherTelephone.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Other telephone not found' }, { status: 404 });
    }

    const updated = await prisma.serviceSeekerOtherTelephone.update({
      where: { id: parseInt(id, 10) },
      data: {
        telephoneType: telephoneType.trim(),
        number: number.trim(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/other-telephones error:', error);
    return NextResponse.json({ error: 'Failed to update other telephone' }, { status: 500 });
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
    const telephoneId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(telephoneId)) return NextResponse.json({ error: 'Invalid other telephone ID' }, { status: 400 });

    if (!prisma.serviceSeekerOtherTelephone) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const telephone = await prisma.serviceSeekerOtherTelephone.findFirst({
      where: { id: telephoneId, serviceSeekerId },
    });

    if (!telephone) {
      return NextResponse.json({ error: 'Other telephone not found' }, { status: 404 });
    }

    await prisma.serviceSeekerOtherTelephone.delete({
      where: { id: telephoneId },
    });

    return NextResponse.json({ message: 'Other telephone deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/other-telephones error:', error);
    return NextResponse.json({ error: 'Failed to delete other telephone' }, { status: 500 });
  }
}

