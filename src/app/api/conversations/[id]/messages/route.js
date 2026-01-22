import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify token and get user ID
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/conversations/[id]/messages - Get all messages for a conversation
export async function GET(request, { params }) {
  try {
    const decoded = await verifyToken(request);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = parseInt(id);

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const userId = decoded.userId;

    // Check if models exist in Prisma client
    if (!prisma.conversation || !prisma.conversationParticipant || !prisma.message) {
      console.error('Prisma client not regenerated. Conversation models are missing.');
      return NextResponse.json(
        {
          error: 'Database models not initialized. Please run: npx prisma generate && npx prisma migrate dev',
          code: 'PRISMA_NOT_GENERATED',
          messages: []
        },
        { status: 503 }
      );
    }

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: parseInt(userId),
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Update last read time
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: parseInt(userId) },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Create a new message
export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = parseInt(id);
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const decoded = await verifyToken(request);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if models exist in Prisma client
    if (!prisma.conversation || !prisma.conversationParticipant || !prisma.message) {
      console.error('Prisma client not regenerated. Conversation models are missing.');
      return NextResponse.json(
        {
          error: 'Database models not initialized. Please run: npx prisma generate && npx prisma migrate dev',
          code: 'PRISMA_NOT_GENERATED'
        },
        { status: 503 }
      );
    }

    const userIdInt = decoded.userId;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: userIdInt,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userIdInt,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Create notifications for other participants
    try {
      // Check if Notification model exists
      if (!prisma.notification) {
        console.error('Notification model not available in Prisma client. Run: npx prisma generate');
        return NextResponse.json({ message }); // Still return success for message
      }

      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userIdInt }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('Other participants for notification:', otherParticipants.length);

      // Create notification for each other participant
      const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
      const notifications = otherParticipants.map(participant => ({
        userId: participant.userId,
        title: `New message from ${senderName}`,
        message: content.trim().length > 50 ? content.trim().substring(0, 50) + '...' : content.trim(),
        type: 'INFO',
        link: null,
        isRead: false
      }));

      console.log('Creating notifications:', notifications);

      if (notifications.length > 0) {
        const result = await prisma.notification.createMany({
          data: notifications
        });
        console.log('Notifications created successfully:', result);
      } else {
        console.log('No other participants to notify');
      }
    } catch (notificationError) {
      // Log but don't fail the message sending if notification creation fails
      console.error('Error creating message notifications:', notificationError);
      console.error('Notification error stack:', notificationError.stack);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

