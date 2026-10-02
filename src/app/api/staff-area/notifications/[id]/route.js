import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function authenticate(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (err) {
    return null;
  }
}

// GET /api/staff-area/notifications/[id]
export async function GET(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const notification = await prisma.staffFormalNotification.findUnique({
      where: { id: notificationId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        acknowledgements: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: { select: { displayName: true } },
              },
            },
          },
          orderBy: { readAt: 'desc' },
        },
      },
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    // Determine targeted users
    const activeUsers = await prisma.user.findMany({
      where: { status: 'CURRENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
        role: { select: { name: true, displayName: true } },
      },
    });

    let sentRoles = [];
    try {
      sentRoles = notification.sentByRoles ? JSON.parse(notification.sentByRoles) : [];
    } catch (e) {
      sentRoles = [];
    }

    let sentUserIds = [];
    try {
      sentUserIds = notification.sentToUserIds ? JSON.parse(notification.sentToUserIds) : [];
    } catch (e) {
      sentUserIds = [];
    }

    let targetUsers = [];
    if (notification.targetType === 'ALL' || (!sentRoles.length && !sentUserIds.length && notification.targetType !== 'CUSTOM')) {
      targetUsers = activeUsers;
    } else {
      targetUsers = activeUsers.filter((u) => {
        const matchesRole =
          sentRoles.includes(u.roleId?.toString()) ||
          sentRoles.includes(u.roleId) ||
          sentRoles.includes(u.role?.name) ||
          sentRoles.includes(u.role?.displayName);
        const matchesUser = sentUserIds.includes(u.id) || sentUserIds.includes(u.id.toString());
        return matchesRole || matchesUser;
      });
    }

    const ackUserIds = new Set(notification.acknowledgements.map((a) => a.userId));
    const unacknowledgedUsers = targetUsers.filter((u) => !ackUserIds.has(u.id));

    return NextResponse.json({
      success: true,
      data: {
        ...notification,
        sentByRoles: sentRoles,
        sentToUserIds: sentUserIds,
        totalTargetCount: targetUsers.length,
        acknowledgedCount: notification.acknowledgements.length,
        unacknowledgedUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching notification details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification details', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/staff-area/notifications/[id]
export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.staffFormalNotification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting formal notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete formal notification', details: error.message },
      { status: 500 }
    );
  }
}
