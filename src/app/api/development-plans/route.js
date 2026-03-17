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

    const where = { status: { not: 'ARCHIVED' } };
    if (userId) where.userId = parseInt(userId);

    const pdps = await prisma.personalDevelopmentPlan.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        goals: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: pdps });
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
    const { userId, reviewDate, notes, goals } = body;

    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });

    const pdp = await prisma.personalDevelopmentPlan.create({
      data: {
        userId: parseInt(userId),
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        notes,
        createdById: decoded.userId,
        goals: goals && goals.length > 0 ? {
          create: goals.map(g => ({
            goal: g.goal,
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
            status: g.status || 'IN_PROGRESS',
            notes: g.notes
          }))
        } : undefined
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        goals: true
      }
    });
    return NextResponse.json({ success: true, data: pdp });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
