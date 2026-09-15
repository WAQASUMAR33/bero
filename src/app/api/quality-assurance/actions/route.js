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
    roleName === 'HR' ||
    roleName === 'DIRECTOR' ||
    hasPermission(user, 'quality-assurance.manage') ||
    hasPermission(user, 'users.manage')
  );
}

function checkIsServiceLead(user) {
  if (!user) return false;
  const roleName = (user.role?.name || '').toUpperCase();
  return (
    roleName === 'SERVICE_LEAD' ||
    roleName === 'TEAM_LEAD' ||
    roleName === 'SENIOR_CARE_WORKER' ||
    roleName === 'FIELD_SUPERVISOR'
  );
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isManagement = checkIsManagement(currentUser);
    const isServiceLead = !isManagement && checkIsServiceLead(currentUser);
    const { searchParams } = new URL(request.url);
    const requestedStaffId = searchParams.get('staffId');
    const statusFilter = searchParams.get('status');

    // Fetch active staff users for the Staff Action Plan overview
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
    // Note in Beerusys/Action Plan.xlsx:
    // Support workers: only see their own actions
    // Service leads: see their own actions + the staff they line manage (e.g. team members or support workers)
    // Managers: see all actions
    let where = {};

    if (isManagement) {
      if (requestedStaffId && requestedStaffId !== 'all') {
        where.staffId = parseInt(requestedStaffId, 10);
      }
    } else if (isServiceLead) {
      // Find staff in the same team, or support workers
      const managedStaffIds = staffList
        .filter(s => (currentUser.teamId && s.team?.id === currentUser.teamId) || s.role?.name === 'SUPPORT_WORKER' || s.role?.name === 'CARE_WORKER')
        .map(s => s.id);
      managedStaffIds.push(currentUser.id);

      if (requestedStaffId && requestedStaffId !== 'all') {
        const targetId = parseInt(requestedStaffId, 10);
        if (managedStaffIds.includes(targetId)) {
          where.staffId = targetId;
        } else {
          where.staffId = currentUser.id;
        }
      } else {
        where.staffId = { in: managedStaffIds };
      }
    } else {
      // Non-management support worker only ever sees their own actions
      where.staffId = currentUser.id;
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const serviceSeekerIdParam = searchParams.get('serviceSeekerId');
    if (serviceSeekerIdParam && serviceSeekerIdParam !== 'all') {
      const parsedSeekerId = parseInt(serviceSeekerIdParam, 10);
      if (!isNaN(parsedSeekerId)) {
        where.serviceSeekerId = parsedSeekerId;
        // When a care worker requests actions for a specific resident during their active shift,
        // allow them to view actions assigned for that resident
        if (!isManagement && !isServiceLead) {
          delete where.staffId;
        }
      }
    }

    const actions = await prisma.qaActionItem.findMany({
      where,
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, address: true }
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
      item,
      description,
      actionRequired,
      dateIdentified,
      priority = 'MEDIUM',
      dueDate,
      source = 'Audit Finding',
      notes,
      comments,
      auditId,
      serviceSeekerId,
    } = body;

    const actionItemTitle = (item || title || '').trim();
    const actionRequiredText = (actionRequired || description || '').trim();

    if (!actionItemTitle) {
      return NextResponse.json({ success: false, error: 'Item / Action title is required' }, { status: 400 });
    }

    const targetStaffId = parseInt(staffId || body.assignedToId, 10);
    if (!targetStaffId) {
      return NextResponse.json({ success: false, error: 'Please assign this action to a staff member' }, { status: 400 });
    }

    const targetSeekerId = serviceSeekerId ? parseInt(serviceSeekerId, 10) : null;

    const newAction = await prisma.qaActionItem.create({
      data: {
        staffId: targetStaffId,
        title: actionItemTitle,
        item: actionItemTitle,
        description: actionRequiredText || null,
        actionRequired: actionRequiredText || null,
        dateIdentified: dateIdentified ? new Date(dateIdentified) : new Date(),
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        dueDate: dueDate ? new Date(dueDate) : null,
        source: source || 'Audit Finding',
        notes: (comments || notes)?.trim() || null,
        comments: (comments || notes)?.trim() || null,
        auditId: auditId ? parseInt(auditId, 10) : null,
        serviceSeekerId: targetSeekerId && !isNaN(targetSeekerId) ? targetSeekerId : null,
        createdById: currentUser.id,
      },
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, address: true }
        }
      }
    });

    // Automatically send notification to the assigned care worker
    try {
      let residentLabel = '';
      if (newAction.serviceSeeker) {
        residentLabel = ` regarding ${newAction.serviceSeeker.firstName} ${newAction.serviceSeeker.lastName}`;
      }
      const dueText = dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString('en-GB')}.` : '';

      await prisma.notification.create({
        data: {
          userId: targetStaffId,
          title: 'New Action Plan Assigned',
          message: `You have been assigned an action plan: "${actionItemTitle}"${residentLabel}.${dueText}`,
          type: 'WARNING',
          link: '/care-worker/action-plan',
          isRead: false
        }
      });
    } catch (notifError) {
      console.error('Failed to create assignment notification:', notifError);
    }

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
    const { id, status, notes, comments, priority, dueDate, title, item, description, actionRequired, staffId, serviceSeekerId } = body;

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

    if (notes !== undefined || comments !== undefined) {
      const commentText = (comments !== undefined ? comments : notes);
      updateData.notes = commentText;
      updateData.comments = commentText;
    }

    if (isManagement) {
      if (priority) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (title || item) {
        const t = (item || title).trim();
        updateData.title = t;
        updateData.item = t;
      }
      if (description !== undefined || actionRequired !== undefined) {
        const d = actionRequired !== undefined ? actionRequired : description;
        updateData.description = d;
        updateData.actionRequired = d;
      }
      if (staffId) updateData.staffId = parseInt(staffId, 10);
      if (serviceSeekerId !== undefined) {
        updateData.serviceSeekerId = serviceSeekerId ? parseInt(serviceSeekerId, 10) : null;
      }
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
        },
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, address: true }
        }
      }
    });

    // If completed by care worker, notify creator/manager
    if (status === 'COMPLETED' && existing.createdById && existing.createdById !== currentUser.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: existing.createdById,
            title: 'Action Plan Completed',
            message: `${currentUser.firstName || 'Care worker'} marked action item "${existing.title}" as completed.`,
            type: 'SUCCESS',
            link: '/admin/quality-assurance?tab=actions',
            isRead: false
          }
        });
      } catch (e) {}
    }

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
