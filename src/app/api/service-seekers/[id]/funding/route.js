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

    const rows = await prisma.serviceSeekerFunding.findMany({
      where: { serviceSeekerId },
      include: { fundingSource: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET funding error:', e);
    return NextResponse.json({ error: 'Failed to fetch funding' }, { status: 500 });
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
    const created = await prisma.serviceSeekerFunding.create({
      data: {
        serviceSeekerId,
        fundingSourceId: parseInt(body.fundingSourceId, 10),
        percentageSplit: body.percentageSplit ? parseFloat(body.percentageSplit) : null,
        contractNumber: body.contractNumber?.trim() || null,
        typeOfService: body.typeOfService?.trim() || null,
        costNotes: body.costNotes?.trim() || null,
        paymentType: body.paymentType === 'PER_SHIFT' ? 'PER_SHIFT' : 'BY_PERCENTAGE_SPENT',
      },
      include: { fundingSource: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST funding error:', e);
    return NextResponse.json({ error: 'Failed to create funding' }, { status: 500 });
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
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await prisma.serviceSeekerFunding.update({
      where: { id: parseInt(body.id, 10) },
      data: {
        fundingSourceId: parseInt(body.fundingSourceId, 10),
        percentageSplit: body.percentageSplit ? parseFloat(body.percentageSplit) : null,
        contractNumber: body.contractNumber?.trim() || null,
        typeOfService: body.typeOfService?.trim() || null,
        costNotes: body.costNotes?.trim() || null,
        paymentType: body.paymentType === 'PER_SHIFT' ? 'PER_SHIFT' : 'BY_PERCENTAGE_SPENT',
      },
      include: { fundingSource: true },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT funding error:', e);
    return NextResponse.json({ error: 'Failed to update funding' }, { status: 500 });
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

    const row = await prisma.serviceSeekerFunding.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Funding row not found' }, { status: 404 });

    await prisma.serviceSeekerFunding.delete({ where: { id } });
    return NextResponse.json({ message: 'Funding deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE funding error:', e);
    return NextResponse.json({ error: 'Failed to delete funding' }, { status: 500 });
  }
}


