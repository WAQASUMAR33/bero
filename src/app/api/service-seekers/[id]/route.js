'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/service-seekers/[id]
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const seeker = await prisma.serviceSeeker.findUnique({ where: { id } });
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
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.serviceSeeker.update({
      where: { id },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update service user' }, { status: 500 });
  }
}

// DELETE /api/service-seekers/[id]
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;

    // Ensure there are no dependent shifts blocking deletion
    await prisma.shift.deleteMany({ where: { serviceSeekerId: id } });

    await prisma.serviceSeeker.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete service user' }, { status: 500 });
  }
}


