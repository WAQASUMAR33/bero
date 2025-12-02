import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all quality assurance entries
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const entries = await prisma.qualityAssurance.findMany({
      where,
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
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching quality assurance entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quality assurance entries', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new quality assurance entry
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { date, type, from, youSaid, weDid, lessonsLearnt, status } = body;

    if (!date || !type || !from) {
      return NextResponse.json(
        { success: false, error: 'Date, type, and from are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.qualityAssurance.create({
      data: {
        date: new Date(date),
        type,
        from,
        youSaid: youSaid || null,
        weDid: weDid || null,
        lessonsLearnt: lessonsLearnt || null,
        status: status || 'OPEN',
        createdById: decoded.userId,
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
    console.error('Error creating quality assurance entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quality assurance entry', details: error.message },
      { status: 500 }
    );
  }
}

