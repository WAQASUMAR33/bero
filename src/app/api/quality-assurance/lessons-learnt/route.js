import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all lessons learnt
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.dateOfEvent = {};
      if (startDate) where.dateOfEvent.gte = new Date(startDate);
      if (endDate) where.dateOfEvent.lte = new Date(endDate);
    }

    const lessons = await prisma.lessonLearnt.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { dateOfEvent: 'desc' }
    });

    return NextResponse.json({ success: true, data: lessons });
  } catch (error) {
    console.error('Error fetching lessons learnt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons learnt', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new lesson learnt
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const {
      dateOfEvent,
      category,
      title,
      description,
      lessonLearnt,
      actionsTaken,
      changesMade,
      responsiblePerson,
      reviewDate,
      status
    } = body;

    if (!dateOfEvent || !category || !title) {
      return NextResponse.json(
        { success: false, error: 'Date of event, category, and title are required' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lessonLearnt.create({
      data: {
        dateOfEvent: new Date(dateOfEvent),
        category,
        title,
        description: description || null,
        lessonLearnt: lessonLearnt || null,
        actionsTaken: actionsTaken || null,
        changesMade: changesMade || null,
        responsiblePerson: responsiblePerson || null,
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        status: status || 'OPEN',
        createdById: decoded.userId,
        updatedById: decoded.userId
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: lesson });
  } catch (error) {
    console.error('Error creating lesson learnt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson learnt', details: error.message },
      { status: 500 }
    );
  }
}
