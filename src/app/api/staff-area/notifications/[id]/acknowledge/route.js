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

// POST /api/staff-area/notifications/[id]/acknowledge
export async function POST(request, { params }) {
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

    const currentUserId = user.userId || user.id;

    // Check notification exists
    const notification = await prisma.staffFormalNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    // Upsert acknowledgement
    const ack = await prisma.staffNotificationAck.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId: currentUserId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId: currentUserId,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification acknowledged successfully',
      data: ack,
    });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to acknowledge notification', details: error.message },
      { status: 500 }
    );
  }
}
