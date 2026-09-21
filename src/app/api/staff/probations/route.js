import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// GET /api/staff/probations
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const isManagerUser = isManager(currentUser);

    const where = {};

    if (!isManagerUser) {
      // Non-managers can ONLY see their own probation reviews
      where.userId = currentUser.id;
    } else if (requestedUserId) {
      where.userId = parseInt(requestedUserId);
    }

    const probations = await prisma.staffProbation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            startDate: true,
            role: { select: { id: true, name: true, displayName: true } }
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { id: true, name: true, displayName: true } }
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const formatted = probations.map(p => {
      let computedStatus = p.status;
      if (p.status !== 'PASSED' && p.status !== 'FAILED') {
        if (p.dueDate) {
          const dueDate = new Date(p.dueDate);
          if (dueDate < now) {
            computedStatus = 'OVERDUE';
          } else if (dueDate <= thirtyDaysFromNow) {
            computedStatus = 'DUE_SOON';
          } else {
            computedStatus = p.status || 'UNDER_PROBATION';
          }
        }
      }
      return {
        ...p,
        computedStatus
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching probation reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch probation reviews' }, { status: 500 });
  }
}

// POST /api/staff/probations
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can log probation reviews.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      reviewerId,
      startDate,
      dueDate,
      reviewDate,
      status = 'UNDER_PROBATION',
      outcome,
      notes
    } = body;

    if (!userId || !dueDate) {
      return NextResponse.json({ error: 'Staff member (userId) and Review Due Date are required.' }, { status: 400 });
    }

    const probation = await prisma.staffProbation.create({
      data: {
        userId: parseInt(userId),
        reviewerId: reviewerId ? parseInt(reviewerId) : currentUser.id,
        startDate: parseDate(startDate),
        dueDate: parseDate(dueDate),
        reviewDate: parseDate(reviewDate),
        status: status || 'UNDER_PROBATION',
        outcome: outcome || null,
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(probation, { status: 201 });
  } catch (error) {
    console.error('Error creating probation review:', error);
    return NextResponse.json({ error: 'Failed to create probation review' }, { status: 500 });
  }
}

// PUT /api/staff/probations
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can update probation reviews.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      reviewerId,
      startDate,
      dueDate,
      reviewDate,
      status,
      outcome,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Probation ID is required.' }, { status: 400 });
    }

    const updateData = {};
    if (reviewerId !== undefined) updateData.reviewerId = reviewerId ? parseInt(reviewerId) : null;
    if (startDate !== undefined) updateData.startDate = parseDate(startDate);
    if (dueDate !== undefined) updateData.dueDate = parseDate(dueDate);
    if (reviewDate !== undefined) updateData.reviewDate = parseDate(reviewDate);
    if (status !== undefined) updateData.status = status;
    if (outcome !== undefined) updateData.outcome = outcome || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const probation = await prisma.staffProbation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(probation);
  } catch (error) {
    console.error('Error updating probation review:', error);
    return NextResponse.json({ error: 'Failed to update probation review' }, { status: 500 });
  }
}

// DELETE /api/staff/probations
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can delete probation reviews.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Probation ID is required.' }, { status: 400 });
    }

    await prisma.staffProbation.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'Probation review deleted successfully' });
  } catch (error) {
    console.error('Error deleting probation review:', error);
    return NextResponse.json({ error: 'Failed to delete probation review' }, { status: 500 });
  }
}
