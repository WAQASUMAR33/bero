import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET single lesson learnt
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const lesson = await prisma.lessonLearnt.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lesson });
  } catch (error) {
    console.error('Error fetching lesson learnt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson learnt', details: error.message },
      { status: 500 }
    );
  }
}

// PUT update lesson learnt
export async function PUT(request, { params }) {
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

    const updatedLesson = await prisma.lessonLearnt.update({
      where: { id: parseInt(params.id) },
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

    return NextResponse.json({ success: true, data: updatedLesson });
  } catch (error) {
    console.error('Error updating lesson learnt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson learnt', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE lesson learnt
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await prisma.lessonLearnt.delete({
      where: { id: parseInt(params.id) }
    });

    return NextResponse.json({ success: true, message: 'Lesson learnt deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson learnt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson learnt', details: error.message },
      { status: 500 }
    );
  }
}
