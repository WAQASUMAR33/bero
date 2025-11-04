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

    const notes = await prisma.serviceSeekerConfidentialNote.findMany({ where: { serviceSeekerId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(notes || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/confidential-notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
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
    const created = await prisma.serviceSeekerConfidentialNote.create({
      data: {
        serviceSeekerId,
        noteDate: body.noteDate ? new Date(body.noteDate) : new Date(),
        staffName: body.staffName?.trim() || null,
        notes: body.notes?.trim() || null,
        pictureUrl: body.pictureUrl || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/confidential-notes error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
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
    const noteId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(noteId)) return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });

    const note = await prisma.serviceSeekerConfidentialNote.findFirst({ where: { id: noteId, serviceSeekerId } });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    await prisma.serviceSeekerConfidentialNote.delete({ where: { id: noteId } });
    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/confidential-notes error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}


