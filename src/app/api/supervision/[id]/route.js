'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const supervision = await prisma.supervision.findUnique({
      where: { id: parseInt(id) },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    if (!supervision) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: supervision });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const body = await request.json();
    const { scheduledDate, conductedDate, type, status, notes, actionPoints, nextSupervision, supervisorId } = body;

    const supervision = await prisma.supervision.update({
      where: { id: parseInt(id) },
      data: {
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        conductedDate: conductedDate ? new Date(conductedDate) : null,
        type,
        status,
        notes,
        actionPoints,
        nextSupervision: nextSupervision ? new Date(nextSupervision) : null,
        supervisorId: supervisorId ? parseInt(supervisorId) : undefined
      },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    return NextResponse.json({ success: true, data: supervision });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    await prisma.supervision.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
