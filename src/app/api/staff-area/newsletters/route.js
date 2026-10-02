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

// GET /api/staff-area/newsletters
export async function GET(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const newsletters = await prisma.staffNewsletter.findMany({
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: newsletters });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch newsletters', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/staff-area/newsletters
export async function POST(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, fileUrl, fileName, fileSize, publishedAt } = body;

    if (!title || !fileUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Title, fileUrl and fileName are required' },
        { status: 400 }
      );
    }

    const currentUserId = user.userId || user.id;

    const newsletter = await prisma.staffNewsletter.create({
      data: {
        title,
        description: description || null,
        fileUrl,
        fileName,
        fileSize: fileSize || null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        createdById: currentUserId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: newsletter }, { status: 201 });
  } catch (error) {
    console.error('Error creating newsletter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create newsletter', details: error.message },
      { status: 500 }
    );
  }
}
