import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const area = searchParams.get('area');
    const search = searchParams.get('search');

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (area && area !== 'ALL') {
      where.area = area;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { actionRequired: { contains: search } },
        { assignedTo: { contains: search } }
      ];
    }

    const actions = await prisma.kpiActionPlanItem.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const counts = {
      total: await prisma.kpiActionPlanItem.count(),
      open: await prisma.kpiActionPlanItem.count({ where: { status: 'OPEN' } }),
      inProgress: await prisma.kpiActionPlanItem.count({ where: { status: 'IN_PROGRESS' } }),
      completed: await prisma.kpiActionPlanItem.count({ where: { status: 'COMPLETED' } }),
      overdue: await prisma.kpiActionPlanItem.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          targetDate: { lt: new Date() }
        }
      })
    };

    return NextResponse.json({
      success: true,
      actions,
      counts
    });
  } catch (error) {
    console.error('Error fetching KPI action items:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, area, sourceMonth, description, actionRequired, assignedTo, priority, targetDate } = body;

    if (!title || !area || !actionRequired) {
      return NextResponse.json(
        { success: false, error: 'Title, Area, and Action Required are required fields.' },
        { status: 400 }
      );
    }

    const newAction = await prisma.kpiActionPlanItem.create({
      data: {
        title,
        area,
        sourceMonth: sourceMonth || 'Manual Escalation',
        description: description || '',
        actionRequired,
        assignedTo: assignedTo || 'Registered Manager',
        priority: priority || 'MEDIUM',
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'OPEN',
        createdById: currentUser.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Action plan item added successfully.',
      action: newAction
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI action item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, area, actionRequired, assignedTo, priority, targetDate, status, progressNotes, completionDate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updatedAction = await prisma.kpiActionPlanItem.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title !== undefined ? title : undefined,
        area: area !== undefined ? area : undefined,
        actionRequired: actionRequired !== undefined ? actionRequired : undefined,
        assignedTo: assignedTo !== undefined ? assignedTo : undefined,
        priority: priority !== undefined ? priority : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        status: status !== undefined ? status : undefined,
        progressNotes: progressNotes !== undefined ? progressNotes : undefined,
        completionDate: status === 'COMPLETED' ? (completionDate ? new Date(completionDate) : new Date()) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Action plan item updated successfully.',
      action: updatedAction
    });
  } catch (error) {
    console.error('Error updating KPI action item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.kpiActionPlanItem.delete({
      where: { id: parseInt(id, 10) }
    });

    return NextResponse.json({
      success: true,
      message: 'Action plan item deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting KPI action item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
