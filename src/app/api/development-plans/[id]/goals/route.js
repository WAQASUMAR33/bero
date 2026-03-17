'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const body = await request.json();
    const { goal, targetDate, status, notes } = body;
    if (!goal) return NextResponse.json({ success: false, error: 'goal is required' }, { status: 400 });

    const newGoal = await prisma.pDPGoal.create({
      data: {
        pdpId: parseInt(id),
        goal,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status || 'IN_PROGRESS',
        notes
      }
    });
    return NextResponse.json({ success: true, data: newGoal });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
