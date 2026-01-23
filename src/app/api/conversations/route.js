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

// GET /api/conversations - Get all conversations for the current user
export async function GET(request) {
  try {
    const decoded = await verifyToken(request);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Check if conversation model exists in Prisma client
    if (!prisma.conversation) {
      console.error('Prisma client not regenerated. Conversation model is missing.');
      return NextResponse.json(
        {
          error: 'Database models not initialized. Please run: npx prisma generate && npx prisma migrate dev',
          code: 'PRISMA_NOT_GENERATED',
          conversations: []
        },
        { status: 503 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: parseInt(userId),
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePic: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Batch fetch unread counts for all conversations
    const conversationIds = conversations.map(c => c.id);

    // Get lastReadAt for the user in each conversation
    // This is complex because lastReadAt is on the participant record.
    // We can filter efficiently in memory since we already have the participants loaded

    // Simplification: We will count all unread messages where sender != user.
    // In a rigorous implementation we compare against lastReadAt per conversation.
    // For batching, let's look at all unread messages for these conversations sent by others.

    const unreadGroups = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: parseInt(userId) },
        isRead: false
      },
      _count: {
        id: true
      }
    });

    const unreadMap = {};
    unreadGroups.forEach(group => {
      unreadMap[group.conversationId] = group._count.id;
    });

    // Format conversations with last message and unread count
    const formattedConversations = conversations.map((conversation) => {
      const lastMessage = conversation.messages[0] || null;

      // Use pre-fetched count (default to 0 if not found)
      // Note: This batch approach slightly simplifies the "lastReadAt" logic which was in the loop.
      // If exact "lastReadAt" precision is required per-message, a raw query is needed.
      // However, for standard "unread" status, checking isRead=false is usually the source of truth in this schema type.
      // If we strictly need key-date comparison, we would need a more complex single query,
      // but removing the N+1 `prisma.message.count` loop is the priority for connection limits.

      const unreadCount = unreadMap[conversation.id] || 0;

      return {
        id: conversation.id,
        participants: conversation.participants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : null,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request) {
  try {
    const decoded = await verifyToken(request);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId: otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const currentUserIdInt = decoded.userId;
    const otherUserIdInt = parseInt(otherUserId);

    if (currentUserIdInt === otherUserIdInt) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation model exists in Prisma client
    if (!prisma.conversation) {
      console.error('Prisma client not regenerated. Conversation model is missing.');
      return NextResponse.json(
        {
          error: 'Database models not initialized. Please run: npx prisma generate && npx prisma migrate dev',
          code: 'PRISMA_NOT_GENERATED'
        },
        { status: 503 }
      );
    }

    // Check if conversation already exists (exactly 2 participants with these user IDs)
    const existingConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserIdInt,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePic: true,
              },
            },
          },
        },
      },
    });

    // Find conversation with exactly 2 participants matching both users
    const existingConversation = existingConversations.find(conv => {
      const participantIds = conv.participants.map(p => p.userId);
      return (
        participantIds.length === 2 &&
        participantIds.includes(currentUserIdInt) &&
        participantIds.includes(otherUserIdInt)
      );
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUserIdInt },
            { userId: otherUserIdInt },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePic: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

