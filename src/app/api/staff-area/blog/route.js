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

// GET /api/staff-area/blog
export async function GET(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.userId || user.id;

    const posts = await prisma.staffBlogPost.findMany({
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
      orderBy: { publishedAt: 'desc' },
    });

    const formattedPosts = posts.map((post) => {
      const likesCount = post.likes.length;
      const hasLiked = post.likes.some((like) => like.userId === currentUserId);
      const { likes, ...rest } = post;
      return {
        ...rest,
        likesCount,
        hasLiked,
      };
    });

    return NextResponse.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/staff-area/blog
export async function POST(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, publishedAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const currentUserId = user.userId || user.id;

    const post = await prisma.staffBlogPost.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        createdById: currentUserId,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...post,
          likesCount: 0,
          hasLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post', details: error.message },
      { status: 500 }
    );
  }
}
