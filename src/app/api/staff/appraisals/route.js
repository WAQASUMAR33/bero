import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// GET /api/staff/appraisals
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
      // Non-managers can ONLY see their own appraisals
      where.userId = currentUser.id;
    } else if (requestedUserId) {
      where.userId = parseInt(requestedUserId);
    }

    const appraisals = await prisma.staffAppraisal.findMany({
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
        appraiser: {
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
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    const formatted = appraisals.map(a => {
      let computedStatus = a.status;
      if (a.dueDate) {
        const dueDate = new Date(a.dueDate);
        if (dueDate < now) {
          computedStatus = 'OVERDUE';
        } else if (dueDate <= sixtyDaysFromNow) {
          computedStatus = 'DUE_SOON';
        } else {
          computedStatus = 'UP_TO_DATE';
        }
      }
      return {
        ...a,
        computedStatus
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching appraisals:', error);
    return NextResponse.json({ error: 'Failed to fetch appraisals' }, { status: 500 });
  }
}

// POST /api/staff/appraisals
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can record appraisals.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      appraiserId,
      lastAppraisalDate,
      dueDate,
      status = 'PENDING',
      rating,
      feedback,
      goals,
      notes
    } = body;

    if (!userId || !dueDate) {
      return NextResponse.json({ error: 'Staff member (userId) and Due Date are required.' }, { status: 400 });
    }

    const appraisal = await prisma.staffAppraisal.create({
      data: {
        userId: parseInt(userId),
        appraiserId: appraiserId ? parseInt(appraiserId) : currentUser.id,
        lastAppraisalDate: parseDate(lastAppraisalDate),
        dueDate: parseDate(dueDate),
        status: status || 'PENDING',
        rating: rating || null,
        feedback: feedback || null,
        goals: goals || null,
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        appraiser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(appraisal, { status: 201 });
  } catch (error) {
    console.error('Error creating appraisal:', error);
    return NextResponse.json({ error: 'Failed to create appraisal' }, { status: 500 });
  }
}

// PUT /api/staff/appraisals
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can update appraisals.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      appraiserId,
      lastAppraisalDate,
      dueDate,
      status,
      rating,
      feedback,
      goals,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Appraisal ID is required.' }, { status: 400 });
    }

    const updateData = {};
    if (appraiserId !== undefined) updateData.appraiserId = appraiserId ? parseInt(appraiserId) : null;
    if (lastAppraisalDate !== undefined) updateData.lastAppraisalDate = parseDate(lastAppraisalDate);
    if (dueDate !== undefined) updateData.dueDate = parseDate(dueDate);
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating || null;
    if (feedback !== undefined) updateData.feedback = feedback || null;
    if (goals !== undefined) updateData.goals = goals || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const appraisal = await prisma.staffAppraisal.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        appraiser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(appraisal);
  } catch (error) {
    console.error('Error updating appraisal:', error);
    return NextResponse.json({ error: 'Failed to update appraisal' }, { status: 500 });
  }
}

// DELETE /api/staff/appraisals
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can delete appraisals.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Appraisal ID is required.' }, { status: 400 });
    }

    await prisma.staffAppraisal.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'Appraisal deleted successfully' });
  } catch (error) {
    console.error('Error deleting appraisal:', error);
    return NextResponse.json({ error: 'Failed to delete appraisal' }, { status: 500 });
  }
}
