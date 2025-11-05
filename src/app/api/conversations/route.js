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

    // Format conversations with last message and unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = conversation.messages[0] || null;
        
        // Count unread messages
        const participant = conversation.participants.find(p => p.userId === parseInt(userId));
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: parseInt(userId) },
            isRead: false,
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
          },
        });

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
      })
    );

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

