import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET single quality assurance entry
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const id = parseInt(params.id);

    const entry = await prisma.qualityAssurance.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Quality assurance entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching quality assurance entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quality assurance entry', details: error.message },
      { status: 500 }
    );
  }
}

// PUT update quality assurance entry
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { date, type, from, youSaid, weDid, lessonsLearnt, status } = body;

    if (!date || !type || !from) {
      return NextResponse.json(
        { success: false, error: 'Date, type, and from are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.qualityAssurance.update({
      where: { id },
      data: {
        date: new Date(date),
        type,
        from,
        youSaid: youSaid || null,
        weDid: weDid || null,
        lessonsLearnt: lessonsLearnt || null,
        status: status || 'OPEN',
        updatedById: decoded.userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error updating quality assurance entry:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Quality assurance entry not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update quality assurance entry', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE quality assurance entry
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const id = parseInt(params.id);

    await prisma.qualityAssurance.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Quality assurance entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quality assurance entry:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Quality assurance entry not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete quality assurance entry', details: error.message },
      { status: 500 }
    );
  }
}

