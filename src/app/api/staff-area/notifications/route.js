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

// GET /api/staff-area/notifications
export async function GET(request) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = userPayload.userId || userPayload.id;
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'me';
    const filter = searchParams.get('filter'); // 'unread' | 'read' | 'all'

    // Fetch full user details from DB to get up-to-date role info
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (scope === 'admin') {
      // Management view: all formal notifications with statistics
      const notifications = await prisma.staffFormalNotification.findMany({
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          acknowledgements: {
            select: {
              userId: true,
              readAt: true,
              user: {
                select: { id: true, firstName: true, lastName: true, role: { select: { displayName: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get all active users to calculate recipient count for each notification
      const activeUsers = await prisma.user.findMany({
        where: { status: 'CURRENT' },
        select: { id: true, firstName: true, lastName: true, roleId: true, role: { select: { name: true, displayName: true } } },
      });

      const formatted = notifications.map((n) => {
        let sentRoles = [];
        try {
          sentRoles = n.sentByRoles ? JSON.parse(n.sentByRoles) : [];
        } catch (e) {
          sentRoles = [];
        }

        let sentUserIds = [];
        try {
          sentUserIds = n.sentToUserIds ? JSON.parse(n.sentToUserIds) : [];
        } catch (e) {
          sentUserIds = [];
        }

        // Targeted users calculation
        let targetUsers = [];
        if (n.targetType === 'ALL' || (!sentRoles.length && !sentUserIds.length && n.targetType !== 'CUSTOM')) {
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

        const ackUserIds = new Set(n.acknowledgements.map((a) => a.userId));
        const unacknowledgedUsers = targetUsers.filter((u) => !ackUserIds.has(u.id));

        return {
          id: n.id,
          title: n.title,
          body: n.body,
          priority: n.priority,
          targetType: n.targetType,
          sentByRoles: sentRoles,
          sentToUserIds: sentUserIds,
          acknowledgeByDate: n.acknowledgeByDate,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          createdBy: n.createdBy,
          totalTargetCount: targetUsers.length,
          acknowledgedCount: n.acknowledgements.length,
          acknowledgements: n.acknowledgements,
          unacknowledgedUsers: unacknowledgedUsers.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            roleName: u.role?.displayName || u.role?.name || 'Staff',
          })),
        };
      });

      return NextResponse.json({ success: true, data: formatted });
    }

    // Staff/Care Worker View: only notifications targeted to current user
    const allNotifications = await prisma.staffFormalNotification.findMany({
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        acknowledgements: {
          where: { userId: currentUserId },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userRoleId = currentUser.roleId;
    const userRoleName = currentUser.role?.name;
    const userRoleDisplayName = currentUser.role?.displayName;

    const myNotifications = allNotifications.filter((n) => {
      if (n.targetType === 'ALL') return true;

      let sentRoles = [];
      try {
        sentRoles = n.sentByRoles ? JSON.parse(n.sentByRoles) : [];
      } catch (e) {
        sentRoles = [];
      }

      let sentUserIds = [];
      try {
        sentUserIds = n.sentToUserIds ? JSON.parse(n.sentToUserIds) : [];
      } catch (e) {
        sentUserIds = [];
      }

      if (!sentRoles.length && !sentUserIds.length) return true;

      const matchesRole =
        (userRoleId && (sentRoles.includes(userRoleId) || sentRoles.includes(userRoleId.toString()))) ||
        (userRoleName && sentRoles.includes(userRoleName)) ||
        (userRoleDisplayName && sentRoles.includes(userRoleDisplayName));

      const matchesUser = sentUserIds.includes(currentUserId) || sentUserIds.includes(currentUserId.toString());

      return matchesRole || matchesUser;
    });

    const annotated = myNotifications.map((n) => {
      const ack = n.acknowledgements?.[0];
      const isAcknowledged = Boolean(ack);
      const acknowledgedAt = ack?.readAt || null;

      let sentRoles = [];
      try {
        sentRoles = n.sentByRoles ? JSON.parse(n.sentByRoles) : [];
      } catch (e) {
        sentRoles = [];
      }

      return {
        id: n.id,
        title: n.title,
        body: n.body,
        priority: n.priority,
        targetType: n.targetType,
        sentByRoles: sentRoles,
        acknowledgeByDate: n.acknowledgeByDate,
        createdAt: n.createdAt,
        createdBy: n.createdBy,
        isAcknowledged,
        acknowledgedAt,
      };
    });

    const unreadCount = annotated.filter((n) => !n.isAcknowledged).length;

    let filtered = annotated;
    if (filter === 'unread') {
      filtered = annotated.filter((n) => !n.isAcknowledged);
    } else if (filter === 'read') {
      filtered = annotated.filter((n) => n.isAcknowledged);
    }

    return NextResponse.json({
      success: true,
      unreadCount,
      totalCount: annotated.length,
      data: filtered,
    });
  } catch (error) {
    console.error('Error fetching formal notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch formal notifications', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/staff-area/notifications
export async function POST(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.userId || user.id;
    const body = await request.json();
    const {
      title,
      body: content,
      priority = 'NORMAL',
      targetType = 'ALL',
      sentByRoles,
      sentToUserIds,
      acknowledgeByDate,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.staffFormalNotification.create({
      data: {
        title,
        body: content,
        priority,
        targetType,
        sentByRoles: sentByRoles ? (typeof sentByRoles === 'string' ? sentByRoles : JSON.stringify(sentByRoles)) : null,
        sentToUserIds: sentToUserIds ? (typeof sentToUserIds === 'string' ? sentToUserIds : JSON.stringify(sentToUserIds)) : null,
        acknowledgeByDate: acknowledgeByDate ? new Date(acknowledgeByDate) : null,
        createdById: currentUserId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating formal notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create formal notification', details: error.message },
      { status: 500 }
    );
  }
}
