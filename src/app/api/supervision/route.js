'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const type = searchParams.get('type'); // SUPERVISION, APPRAISAL, PROBATION

    const where = {};
    if (staffId) where.staffId = parseInt(staffId);
    if (type) where.type = type;

    const supervisions = await prisma.supervision.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    });
    return NextResponse.json({ success: true, data: supervisions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { staffId, supervisorId, scheduledDate, conductedDate, type, status, notes, actionPoints, nextSupervision } = body;

    if (!staffId || !scheduledDate) {
      return NextResponse.json({ success: false, error: 'staffId and scheduledDate are required' }, { status: 400 });
    }

    const supervision = await prisma.supervision.create({
      data: {
        staffId: parseInt(staffId),
        supervisorId: parseInt(supervisorId || decoded.userId),
        scheduledDate: new Date(scheduledDate),
        conductedDate: conductedDate ? new Date(conductedDate) : null,
        type: type || 'SUPERVISION',
        status: status || 'SCHEDULED',
        notes,
        actionPoints,
        nextSupervision: nextSupervision ? new Date(nextSupervision) : null
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
