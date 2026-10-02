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

// POST /api/staff-area/blog/[id]/like
export async function POST(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const currentUserId = user.userId || user.id;

    // Check if post exists
    const post = await prisma.staffBlogPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.staffBlogLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUserId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.staffBlogLike.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      await prisma.staffBlogLike.create({
        data: {
          postId,
          userId: currentUserId,
        },
      });
      liked = true;
    }

    const likesCount = await prisma.staffBlogLike.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      liked,
      likesCount,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update like status', details: error.message },
      { status: 500 }
    );
  }
}
