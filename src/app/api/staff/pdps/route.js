import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager } from '@/lib/permissions';

const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// GET /api/staff/pdps
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
      // Non-managers can ONLY see their own PDPs
      where.userId = currentUser.id;
    } else if (requestedUserId) {
      where.userId = parseInt(requestedUserId);
    }

    const pdps = await prisma.staffPdp.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            role: { select: { id: true, name: true, displayName: true } }
          }
        }
      },
      orderBy: [
        { targetDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const now = new Date();
    const formatted = pdps.map(p => {
      let computedProgress = p.progress;
      if (p.progress !== 'COMPLETED' && p.targetDate) {
        const target = new Date(p.targetDate);
        if (target < now) {
          computedProgress = 'OVERDUE';
        }
      }
      return {
        ...p,
        computedProgress
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching PDPs:', error);
    return NextResponse.json({ error: 'Failed to fetch PDP records' }, { status: 500 });
  }
}

// POST /api/staff/pdps - Only management can create PDPs
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check: Only management can create Personal Development Plans
    if (!isManager(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only management can create Personal Development Plans (PDPs). Staff can view their PDPs in read-only mode.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      dateIdentified,
      routeIdentified,
      area,
      personResponsible,
      targetDate,
      progress = 'NOT_STARTED',
      notes
    } = body;

    const targetUserId = userId ? parseInt(userId) : currentUser.id;

    if (!area) {
      return NextResponse.json({ error: 'Development Area is required.' }, { status: 400 });
    }

    const pdp = await prisma.staffPdp.create({
      data: {
        userId: targetUserId,
        dateIdentified: parseDate(dateIdentified) || new Date(),
        routeIdentified: routeIdentified || 'Supervision',
        area,
        personResponsible: personResponsible || `${currentUser.firstName} ${currentUser.lastName}`,
        targetDate: parseDate(targetDate),
        progress: progress || 'NOT_STARTED',
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    return NextResponse.json(pdp, { status: 201 });
  } catch (error) {
    console.error('Error creating PDP:', error);
    return NextResponse.json({ error: 'Failed to create PDP record' }, { status: 500 });
  }
}

// PUT /api/staff/pdps - Only management can amend PDPs
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check: Only management can amend Personal Development Plans
    if (!isManager(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only management can amend Personal Development Plans (PDPs). Staff cannot alter their PDP records.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      dateIdentified,
      routeIdentified,
      area,
      personResponsible,
      targetDate,
      completionDate,
      progress,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'PDP ID is required.' }, { status: 400 });
    }

    const existing = await prisma.staffPdp.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return NextResponse.json({ error: 'PDP record not found.' }, { status: 404 });
    }

    const updateData = {};
    if (dateIdentified !== undefined) updateData.dateIdentified = parseDate(dateIdentified);
    if (routeIdentified !== undefined) updateData.routeIdentified = routeIdentified;
    if (area !== undefined) updateData.area = area;
    if (personResponsible !== undefined) updateData.personResponsible = personResponsible;
    if (targetDate !== undefined) updateData.targetDate = parseDate(targetDate);
    if (completionDate !== undefined) updateData.completionDate = parseDate(completionDate);
    if (progress !== undefined) {
      updateData.progress = progress;
      if (progress === 'COMPLETED' && !completionDate) {
        updateData.completionDate = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes || null;

    const pdp = await prisma.staffPdp.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    return NextResponse.json(pdp);
  } catch (error) {
    console.error('Error updating PDP:', error);
    return NextResponse.json({ error: 'Failed to update PDP record' }, { status: 500 });
  }
}

// DELETE /api/staff/pdps - Only management can delete PDPs
export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check: Only management can delete Personal Development Plans
    if (!isManager(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Only management can delete Personal Development Plans (PDPs).' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'PDP ID is required.' }, { status: 400 });
    }

    const existing = await prisma.staffPdp.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return NextResponse.json({ error: 'PDP record not found.' }, { status: 404 });
    }

    await prisma.staffPdp.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'PDP record deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDP:', error);
    return NextResponse.json({ error: 'Failed to delete PDP record' }, { status: 500 });
  }
}
