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
    const userId = searchParams.get('userId');

    const where = userId ? { userId: parseInt(userId) } : {};

    const records = await prisma.staffTrainingRecord.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        trainingType: true
      },
      orderBy: { completedDate: 'desc' }
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
    const { userId, trainingTypeId, completedDate, expiryDate, certificateUrl, provider, notes } = body;

    if (!userId || !trainingTypeId || !completedDate) {
      return NextResponse.json({ success: false, error: 'userId, trainingTypeId and completedDate are required' }, { status: 400 });
    }

    const record = await prisma.staffTrainingRecord.create({
      data: {
        userId: parseInt(userId),
        trainingTypeId: parseInt(trainingTypeId),
        completedDate: new Date(completedDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateUrl,
        provider,
        notes,
        createdById: decoded.userId
      },
      include: { trainingType: true, user: { select: { id: true, firstName: true, lastName: true } } }
    });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
