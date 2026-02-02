'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendPushToRoles } from '@/lib/send-push';

// POST /api/emergency - Trigger emergency alert (Mobile App)
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { location, message } = body;

    // Get the user who triggered the emergency
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        team: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create emergency alert
    const emergencyAlert = await prisma.emergencyAlert.create({
      data: {
        triggeredBy: user.id,
        teamId: user.teamId,
        location: location || null,
        message: message || null,
        status: 'ACTIVE'
      },
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNo: true,
            email: true,
            profilePic: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send emergency notification to all Admins, Directors, HR, and Register Managers
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { name: { in: ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'] } },
          status: 'CURRENT',
          id: { not: user.id } // Don't notify the person who triggered it
        },
        select: { id: true }
      });

      if (adminUsers.length > 0) {
        const triggerName = `${user.firstName} ${user.lastName}`;
        const notificationMessage = `${triggerName} has triggered an emergency alert. ${message ? `Message: ${message}` : ''} ${location ? `Location: ${location}` : ''}`;

        await prisma.notification.createMany({
          data: adminUsers.map(admin => ({
            userId: admin.id,
            title: '🚨 EMERGENCY ALERT',
            message: notificationMessage,
            type: 'ERROR',
            link: '/admin/emergency-reports',
            isRead: false
          }))
        });

        // Send push notification to admin devices (critical - send immediately)
        sendPushToRoles(['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'], {
          title: '🚨 EMERGENCY ALERT',
          message: notificationMessage,
          type: 'ERROR',
          link: '/admin/emergency-reports'
        }).catch(err => console.error('Push notification error:', err));
      }
    } catch (notifError) {
      console.error('Failed to create emergency notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: emergencyAlert
    }, { status: 201 });


  } catch (error) {
    console.error('POST /api/emergency error:', error);
    return NextResponse.json(
      { error: 'Failed to create emergency alert', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/emergency - Get emergency alerts (Web - for managers/admins/HR)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', or null for all
    const teamId = searchParams.get('teamId'); // Filter by team
    const unreadOnly = searchParams.get('unreadOnly') === 'true'; // Only active/acknowledged

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        team: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view emergencies (ADMIN, DIRECTOR, HR, REGISTER_MANAGER, or team manager)
    const allowedRoles = ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'];
    const userRoleName = currentUser.role?.name;
    const canViewAll = allowedRoles.includes(userRoleName);

    // Build where clause
    const whereClause = {};

    // If not admin/director/hr, only show emergencies from their team
    if (!canViewAll && currentUser.teamId) {
      whereClause.teamId = currentUser.teamId;
    } else if (teamId) {
      whereClause.teamId = parseInt(teamId);
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    } else if (unreadOnly) {
      whereClause.status = { in: ['ACTIVE', 'ACKNOWLEDGED'] };
    }

    // Get emergency alerts
    const alerts = await prisma.emergencyAlert.findMany({
      where: whereClause,
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNo: true,
            email: true,
            profilePic: true,
            role: {
              select: {
                name: true,
                displayName: true
              }
            }
          }
        },
        acknowledgedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 alerts
    });

    // Count active alerts
    const activeCount = await prisma.emergencyAlert.count({
      where: {
        ...whereClause,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({
      success: true,
      data: alerts,
      activeCount,
      unreadCount: alerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED').length
    });

  } catch (error) {
    console.error('GET /api/emergency error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency alerts', details: error.message },
      { status: 500 }
    );
  }
}

