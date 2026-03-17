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

    const where = staffId ? { staffId: parseInt(staffId) } : {};

    const records = await prisma.competencySignoff.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        assessor: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json({ success: true, data: records });
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
    const { staffId, assessorId, competencyName, type, date, outcome, notes } = body;

    if (!staffId || !competencyName || !date) {
      return NextResponse.json({ success: false, error: 'staffId, competencyName and date are required' }, { status: 400 });
    }

    const record = await prisma.competencySignoff.create({
      data: {
        staffId: parseInt(staffId),
        assessorId: parseInt(assessorId || decoded.userId),
        competencyName,
        type: type || 'OBSERVATION',
        date: new Date(date),
        outcome: outcome || 'PASS',
        notes
      },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true } },
        assessor: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
