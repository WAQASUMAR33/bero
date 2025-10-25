'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/service-seekers/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);
    const seeker = await prisma.serviceSeeker.findUnique({
      where: { id: seekerId },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });
    if (!seeker) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(seeker, { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch service user' }, { status: 500 });
  }
}

// PUT /api/service-seekers/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);
    const body = await request.json();

    const updated = await prisma.serviceSeeker.update({
      where: { id: seekerId },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        updatedById: decoded.userId,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update service user' }, { status: 500 });
  }
}

// DELETE /api/service-seekers/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);

    // Ensure there are no dependent shifts blocking deletion
    await prisma.shift.deleteMany({ where: { serviceSeekerId: seekerId } });

    await prisma.serviceSeeker.delete({ where: { id: seekerId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete service user' }, { status: 500 });
  }
}


