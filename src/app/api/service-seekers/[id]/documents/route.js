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

    const docs = await prisma.serviceSeekerDocument.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(docs || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
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
    const created = await prisma.serviceSeekerDocument.create({
      data: {
        serviceSeekerId,
        docType: body.docType,
        name: body.name?.trim() || 'Document',
        fileUrl: body.fileUrl || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
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
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });

    const existing = await prisma.serviceSeekerDocument.findFirst({ where: { id: parseInt(id, 10), serviceSeekerId } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const updated = await prisma.serviceSeekerDocument.update({
      where: { id: parseInt(id, 10) },
      data: {
        docType: body.docType,
        name: body.name?.trim() || 'Document',
        fileUrl: body.fileUrl || null,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
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
    const documentId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(documentId)) return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });

    const doc = await prisma.serviceSeekerDocument.findFirst({ where: { id: documentId, serviceSeekerId } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.serviceSeekerDocument.delete({ where: { id: documentId } });
    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}


