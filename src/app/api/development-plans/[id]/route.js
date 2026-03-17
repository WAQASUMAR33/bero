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
    const pdp = await prisma.personalDevelopmentPlan.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, firstName: true, lastName: true } }, goals: { orderBy: { createdAt: 'asc' } } }
    });
    if (!pdp) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: pdp });
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
    const { reviewDate, status, notes } = body;

    const pdp = await prisma.personalDevelopmentPlan.update({
      where: { id: parseInt(id) },
      data: {
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        status,
        notes
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } }, goals: true }
    });
    return NextResponse.json({ success: true, data: pdp });
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
    await prisma.personalDevelopmentPlan.update({ where: { id: parseInt(id) }, data: { status: 'ARCHIVED' } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
