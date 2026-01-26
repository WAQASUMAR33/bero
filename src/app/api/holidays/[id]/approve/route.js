'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/holidays/[id]/approve
export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayId = parseInt(id);

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: {
        status: 'APPROVED',
        approvedById: decoded.userId,
        approvedAt: new Date(),
        updatedById: decoded.userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        holidayType: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: holiday.userId,
        title: 'Holiday Request Approved',
        message: `Your holiday request for ${new Date(holiday.startDate).toLocaleDateString()} has been approved.`,
        type: 'SUCCESS',
        link: '/care-worker/holidays',
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: holiday,
      message: 'Holiday approved successfully'
    });
  } catch (error) {
    console.error('POST /holidays/[id]/approve error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Holiday not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to approve holiday',
      details: error.message
    }, { status: 500 });
  }
}



