import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function checkIsManagement(user) {
  if (!user) return false;
  const role = (user.role?.name || user.roleName || user.role || '').toUpperCase();
  return ['ADMIN', 'DIRECTOR', 'REGISTER_MANAGER', 'HR', 'MANAGER'].includes(role);
}

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const actionId = parseInt(id, 10);
    const action = await prisma.qaActionItem.findUnique({
      where: { id: actionId },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        serviceSeeker: { select: { id: true, firstName: true, lastName: true, address: true } }
      }
    });

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error in GET /api/quality-assurance/actions/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const actionId = parseInt(id, 10);
    const existing = await prisma.qaActionItem.findUnique({
      where: { id: actionId },
      include: {
        staff: true,
        createdBy: true,
        serviceSeeker: true
      }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Action item not found' }, { status: 404 });
    }

    const isManagement = checkIsManagement(currentUser);
    const isAssignedStaff = existing.staffId === currentUser.id;

    // Check if user is currently on an active shift with the service user of this action
    let isOnShiftWithResident = false;
    if (existing.serviceSeekerId) {
      const activeShift = await prisma.clockInOut.findFirst({
        where: {
          userId: currentUser.id,
          serviceSeekerId: existing.serviceSeekerId,
          clockOutTime: null
        }
      });
      if (activeShift) {
        isOnShiftWithResident = true;
      }
    }

    // Care worker can complete/update if they are assigned, or management, or actively on shift with this resident
    if (!isManagement && !isAssignedStaff && !isOnShiftWithResident) {
      return NextResponse.json({ success: false, error: 'Permission denied to update this action item' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, comments, priority, dueDate, title, item, description, actionRequired, staffId, serviceSeekerId } = body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
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
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        serviceSeeker: { select: { id: true, firstName: true, lastName: true, address: true } }
      }
    });

    // Notify the manager/creator when an action is completed by care staff
    if (status === 'COMPLETED' && existing.createdById && existing.createdById !== currentUser.id) {
      try {
        const residentNote = updated.serviceSeeker ? ` for ${updated.serviceSeeker.firstName} ${updated.serviceSeeker.lastName}` : '';
        await prisma.notification.create({
          data: {
            userId: existing.createdById,
            title: 'Action Plan Completed',
            message: `${currentUser.firstName || 'Care worker'} completed action "${existing.title}"${residentNote}.`,
            type: 'SUCCESS',
            link: '/admin/quality-assurance?tab=actions',
            isRead: false
          }
        });
      } catch (err) {
        console.error('Error notifying creator:', err);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/quality-assurance/actions/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update action item', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const actionId = parseInt(id, 10);
    const existing = await prisma.qaActionItem.findUnique({ where: { id: actionId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
    }

    const isManagement = checkIsManagement(currentUser);
    if (!isManagement && existing.createdById !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'Permission denied to delete action' }, { status: 403 });
    }

    await prisma.qaActionItem.delete({ where: { id: actionId } });
    return NextResponse.json({ success: true, message: 'Action deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/quality-assurance/actions/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete action', details: error.message }, { status: 500 });
  }
}
