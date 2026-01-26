import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { userId } = decoded;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const view = searchParams.get('view') || 'active'; // 'active' or 'recycled'
    const skip = (page - 1) * limit;

    // Auto-cleanup: Permanently delete notifications in recycle bin older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fire and forget cleanup (non-blocking)
    prisma.notification.deleteMany({
      where: {
        userId,
        deletedAt: {
          lt: thirtyDaysAgo
        }
      }
    }).catch(err => console.error('Cleanup error:', err));

    let whereClause = { userId };

    if (view === 'recycled') {
      whereClause.deletedAt = { not: null };
    } else {
      whereClause.deletedAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.notification.count({ where: whereClause }),
      view === 'active'
        ? prisma.notification.count({ where: { userId, isRead: false, deletedAt: null } })
        : 0
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clear All (Move to Recycle Bin)
// Clear All or Single (Move to Recycle Bin)
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { userId } = decoded;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Soft delete single notification
      const notificationId = parseInt(id);
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure ownership
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, message: 'Notification removed' });
    } else {
      // Soft delete all active notifications
      await prisma.notification.updateMany({
        where: {
          userId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, message: 'All notifications cleared to recycle bin' });
    }
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: for manual creation (e.g. from postman or other services)
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // In a real app, maybe only admin or system can create notifications?
    // For now we allow any authenticated user to create (maybe tailored for their own or others in future)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'INFO',
        link,
        isRead: false
      }
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
