import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// GET /api/staff/supervisions
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
      // Non-managers can ONLY see their own supervisions
      where.userId = currentUser.id;
    } else if (requestedUserId) {
      where.userId = parseInt(requestedUserId);
    }

    const supervisions = await prisma.staffSupervision.findMany({
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
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { id: true, name: true, displayName: true } }
          }
        }
      },
      orderBy: [
        { nextDueDate: 'asc' },
        { supervisionDate: 'desc' }
      ]
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Compute live due status flags
    const formatted = supervisions.map(s => {
      let computedStatus = s.status;
      if (s.nextDueDate) {
        const dueDate = new Date(s.nextDueDate);
        if (dueDate < now) {
          computedStatus = 'OVERDUE';
        } else if (dueDate <= thirtyDaysFromNow) {
          computedStatus = 'DUE_SOON';
        } else {
          computedStatus = 'UP_TO_DATE';
        }
      }
      return {
        ...s,
        computedStatus
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching supervisions:', error);
    return NextResponse.json({ error: 'Failed to fetch supervisions' }, { status: 500 });
  }
}

// POST /api/staff/supervisions
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can log supervisions.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      supervisorId,
      supervisionDate,
      nextDueDate,
      status = 'COMPLETED',
      type = 'Regular',
      discussionNotes,
      actionAgreed,
      notes
    } = body;

    if (!userId || !supervisionDate) {
      return NextResponse.json({ error: 'Staff member (userId) and Supervision Date are required.' }, { status: 400 });
    }

    const supervision = await prisma.staffSupervision.create({
      data: {
        userId: parseInt(userId),
        supervisorId: supervisorId ? parseInt(supervisorId) : currentUser.id,
        supervisionDate: parseDate(supervisionDate),
        nextDueDate: parseDate(nextDueDate),
        status: status || 'COMPLETED',
        type: type || 'Regular',
        discussionNotes: discussionNotes || null,
        actionAgreed: actionAgreed || null,
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(supervision, { status: 201 });
  } catch (error) {
    console.error('Error creating supervision:', error);
    return NextResponse.json({ error: 'Failed to create supervision' }, { status: 500 });
  }
}

// PUT /api/staff/supervisions
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can update supervisions.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      supervisorId,
      supervisionDate,
      nextDueDate,
      status,
      type,
      discussionNotes,
      actionAgreed,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supervision ID is required.' }, { status: 400 });
    }

    const updateData = {};
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId ? parseInt(supervisorId) : null;
    if (supervisionDate !== undefined) updateData.supervisionDate = parseDate(supervisionDate);
    if (nextDueDate !== undefined) updateData.nextDueDate = parseDate(nextDueDate);
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (discussionNotes !== undefined) updateData.discussionNotes = discussionNotes || null;
    if (actionAgreed !== undefined) updateData.actionAgreed = actionAgreed || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const supervision = await prisma.staffSupervision.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(supervision);
  } catch (error) {
    console.error('Error updating supervision:', error);
    return NextResponse.json({ error: 'Failed to update supervision' }, { status: 500 });
  }
}

// DELETE /api/staff/supervisions
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isManager(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Only managers can delete supervisions.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Supervision ID is required.' }, { status: 400 });
    }

    await prisma.staffSupervision.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'Supervision deleted successfully' });
  } catch (error) {
    console.error('Error deleting supervision:', error);
    return NextResponse.json({ error: 'Failed to delete supervision' }, { status: 500 });
  }
}
