'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// PUT /api/emergency/[id] - Acknowledge or resolve emergency
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const resolvedParams = await params;
    const alertId = parseInt(resolvedParams.id, 10);
    
    if (Number.isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // 'acknowledge' or 'resolve'

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

    // Check permissions
    const allowedRoles = ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'];
    const userRoleName = currentUser.role?.name;
    const canManageAll = allowedRoles.includes(userRoleName);

    // Get the emergency alert
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      include: {
        team: true
      }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Emergency alert not found' }, { status: 404 });
    }

    // Check if user can manage this alert (same team or admin)
    if (!canManageAll && alert.teamId !== currentUser.teamId) {
      return NextResponse.json({ error: 'You do not have permission to manage this alert' }, { status: 403 });
    }

    let updatedAlert;

    if (action === 'acknowledge') {
      if (alert.status === 'ACTIVE') {
        updatedAlert = await prisma.emergencyAlert.update({
          where: { id: alertId },
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedBy: currentUser.id,
            acknowledgedAt: new Date()
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
          }
        });
      } else {
        return NextResponse.json({ error: 'Alert is not in ACTIVE status' }, { status: 400 });
      }
    } else if (action === 'resolve') {
      if (alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') {
        updatedAlert = await prisma.emergencyAlert.update({
          where: { id: alertId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            // If not already acknowledged, acknowledge it first
            ...(alert.status === 'ACTIVE' ? {
              acknowledgedBy: currentUser.id,
              acknowledgedAt: new Date()
            } : {})
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
          }
        });
      } else {
        return NextResponse.json({ error: 'Alert is already resolved' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "acknowledge" or "resolve"' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: updatedAlert
    });

  } catch (error) {
    console.error('PUT /api/emergency/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update emergency alert', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/emergency/[id] - Get single emergency alert
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const resolvedParams = await params;
    const alertId = parseInt(resolvedParams.id, 10);
    
    if (Number.isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
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
      }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Emergency alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('GET /api/emergency/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency alert', details: error.message },
      { status: 500 }
    );
  }
}

