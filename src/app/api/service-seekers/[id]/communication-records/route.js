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

    const { searchParams } = new URL(request.url);
    const logType = searchParams.get('logType');

    const where = {
      serviceSeekerId,
      ...(logType ? { logType } : {}),
    };

    const records = await prisma.serviceSeekerCommunicationRecord.findMany({
      where,
      orderBy: { dateTime: 'desc' },
    });

    return NextResponse.json(records || [], { status: 200 });
  } catch (error) {
    console.error('GET /communication-records error:', error);
    return NextResponse.json({ error: 'Failed to fetch communication records' }, { status: 500 });
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
    if (!body.logType) {
      return NextResponse.json({ error: 'logType is required' }, { status: 400 });
    }

    const created = await prisma.serviceSeekerCommunicationRecord.create({
      data: {
        serviceSeekerId,
        logType: body.logType,
        dateTime: body.dateTime ? new Date(body.dateTime) : new Date(),
        staffName: body.staffName?.trim() || null,
        contactName: body.contactName?.trim() || null,
        relationshipOrRole: body.relationshipOrRole?.trim() || null,
        organization: body.organization?.trim() || null,
        category: body.category?.trim() || null,
        summary: body.summary?.trim() || null,
        details: body.details?.trim() || null,
        actions: body.actions?.trim() || null,
        attachmentUrl: body.attachmentUrl || null,
        metadata: body.metadata || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /communication-records error:', error);
    return NextResponse.json({ error: 'Failed to create communication record' }, { status: 500 });
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
    const id = parseInt(body.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });

    const existing = await prisma.serviceSeekerCommunicationRecord.findFirst({
      where: { id, serviceSeekerId },
    });
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const updated = await prisma.serviceSeekerCommunicationRecord.update({
      where: { id },
      data: {
        dateTime: body.dateTime ? new Date(body.dateTime) : existing.dateTime,
        staffName: body.staffName !== undefined ? (body.staffName?.trim() || null) : existing.staffName,
        contactName: body.contactName !== undefined ? (body.contactName?.trim() || null) : existing.contactName,
        relationshipOrRole: body.relationshipOrRole !== undefined ? (body.relationshipOrRole?.trim() || null) : existing.relationshipOrRole,
        organization: body.organization !== undefined ? (body.organization?.trim() || null) : existing.organization,
        category: body.category !== undefined ? (body.category?.trim() || null) : existing.category,
        summary: body.summary !== undefined ? (body.summary?.trim() || null) : existing.summary,
        details: body.details !== undefined ? (body.details?.trim() || null) : existing.details,
        actions: body.actions !== undefined ? (body.actions?.trim() || null) : existing.actions,
        attachmentUrl: body.attachmentUrl !== undefined ? (body.attachmentUrl || null) : existing.attachmentUrl,
        metadata: body.metadata !== undefined ? body.metadata : existing.metadata,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /communication-records error:', error);
    return NextResponse.json({ error: 'Failed to update communication record' }, { status: 500 });
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
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });

    const row = await prisma.serviceSeekerCommunicationRecord.findFirst({
      where: { id, serviceSeekerId },
    });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerCommunicationRecord.delete({ where: { id } });
    return NextResponse.json({ message: 'Record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /communication-records error:', error);
    return NextResponse.json({ error: 'Failed to delete communication record' }, { status: 500 });
  }
}
