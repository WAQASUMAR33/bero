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

// GET /api/staff-area/blog/[id]
export async function GET(request, { params }) {
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

    const post = await prisma.staffBlogPost.findUnique({
      where: { id: postId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePic: true,
            role: { select: { displayName: true, name: true } },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const likesCount = post.likes.length;
    const hasLiked = post.likes.some((like) => like.userId === currentUserId);
    const { likes, ...rest } = post;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        likesCount,
        hasLiked,
      },
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/staff-area/blog/[id]
export async function PUT(request, { params }) {
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

    const body = await request.json();
    const { title, content, excerpt, coverImage, publishedAt } = body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);

    const post = await prisma.staffBlogPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePic: true,
            role: { select: { displayName: true, name: true } },
          },
        },
        likes: true,
      },
    });

    const currentUserId = user.userId || user.id;
    const likesCount = post.likes.length;
    const hasLiked = post.likes.some((like) => like.userId === currentUserId);

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        likesCount,
        hasLiked,
      },
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/staff-area/blog/[id]
export async function DELETE(request, { params }) {
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

    await prisma.staffBlogPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post', details: error.message },
      { status: 500 }
    );
  }
}
