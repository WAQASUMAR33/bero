import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

function checkIsManagement(user) {
  if (!user) return false;
  const roleName = (user.role?.name || '').toUpperCase();
  return (
    roleName === 'ADMIN' ||
    roleName === 'MANAGER' ||
    roleName === 'REGISTERED_MANAGER' ||
    roleName === 'CARE_COORDINATOR' ||
    hasPermission(user, 'quality-assurance.manage') ||
    hasPermission(user, 'users.manage')
  );
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isManagement = checkIsManagement(currentUser);
    const { searchParams } = new URL(request.url);
    const requestedStaffId = searchParams.get('staffId');
    const statusFilter = searchParams.get('status');

    // Fetch all active staff users for the Staff Action Plan overview
    const staffList = await prisma.user.findMany({
      where: { status: 'CURRENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Determine query filter based on role and parameters
    const where = {};

    if (!isManagement) {
      // Non-management staff only ever see their own assigned actions
      where.staffId = currentUser.id;
    } else {
      // Management can view all, or filter by specific staffId
      if (requestedStaffId && requestedStaffId !== 'all') {
        where.staffId = parseInt(requestedStaffId, 10);
      }
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const actions = await prisma.qaActionItem.findMany({
      where,
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Compute summary counts
    const now = new Date();
    const actionsWithOverdue = actions.map(act => {
      const isOverdue = act.status !== 'COMPLETED' && act.dueDate && new Date(act.dueDate) < now;
      return {
        ...act,
        isOverdue: !!isOverdue,
      };
    });

    // Compute per-staff action plan summary stats
    const allActionsForStats = await prisma.qaActionItem.findMany({
      select: {
        id: true,
        staffId: true,
        status: true,
        dueDate: true
      }
    });

    const staffStatsMap = {};
    staffList.forEach(s => {
      const staffActs = allActionsForStats.filter(a => a.staffId === s.id);
      const openCount = staffActs.filter(a => a.status === 'OPEN').length;
      const inProgressCount = staffActs.filter(a => a.status === 'IN_PROGRESS').length;
      const completedCount = staffActs.filter(a => a.status === 'COMPLETED').length;
      const overdueCount = staffActs.filter(a => a.status !== 'COMPLETED' && a.dueDate && new Date(a.dueDate) < now).length;
      staffStatsMap[s.id] = {
        total: staffActs.length,
        open: openCount,
        inProgress: inProgressCount,
        completed: completedCount,
        overdue: overdueCount,
        completionRate: staffActs.length > 0 ? Math.round((completedCount / staffActs.length) * 100) : 100
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        actions: actionsWithOverdue,
        isManagement,
        currentUserId: currentUser.id,
        staffList,
        staffStatsMap,
        overallStats: {
          total: actions.length,
          open: actions.filter(a => a.status === 'OPEN').length,
          inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
          completed: actions.filter(a => a.status === 'COMPLETED').length,
          overdue: actionsWithOverdue.filter(a => a.isOverdue).length,
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/quality-assurance/actions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch action plans', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      staffId,
      title,
      description,
      priority = 'MEDIUM',
      dueDate,
      source = 'Audit Finding',
      notes,
      auditId,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Action title is required' }, { status: 400 });
    }

    const targetStaffId = parseInt(staffId, 10);
    if (!targetStaffId) {
      return NextResponse.json({ success: false, error: 'Please assign this action to a staff member' }, { status: 400 });
    }

    const newAction = await prisma.qaActionItem.create({
      data: {
        staffId: targetStaffId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        dueDate: dueDate ? new Date(dueDate) : null,
        source: source || 'Audit Finding',
        notes: notes?.trim() || null,
        auditId: auditId ? parseInt(auditId, 10) : null,
        createdById: currentUser.id,
      },
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: newAction });
  } catch (error) {
    console.error('Error in POST /api/quality-assurance/actions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create action plan item', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes, priority, dueDate, title, description, staffId } = body;

    const actionId = parseInt(id, 10);
    const existing = await prisma.qaActionItem.findUnique({ where: { id: actionId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
    }

    const isManagement = checkIsManagement(currentUser);
    const isAssignedStaff = existing.staffId === currentUser.id;

    // Staff can update their own status and add notes; management can update everything
    if (!isManagement && !isAssignedStaff) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    if (notes !== undefined) updateData.notes = notes;

    if (isManagement) {
      if (priority) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description;
      if (staffId) updateData.staffId = parseInt(staffId, 10);
    }

    const updated = await prisma.qaActionItem.update({
      where: { id: actionId },
      data: updateData,
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/quality-assurance/actions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update action item', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);

    const existing = await prisma.qaActionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Action item not found' }, { status: 404 });
    }

    const isManagement = checkIsManagement(currentUser);
    if (!isManagement && existing.createdById !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'Permission denied to delete action' }, { status: 403 });
    }

    await prisma.qaActionItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Action deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/quality-assurance/actions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete action item', details: error.message },
      { status: 500 }
    );
  }
}
