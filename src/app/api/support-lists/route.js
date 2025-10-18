import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserIdFromToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supportLists = await prisma.supportList.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(supportLists);
  } catch (error) {
    console.error('GET /api/support-lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch support lists' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Check if support list already exists
    const existing = await prisma.supportList.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'A support list item with this name already exists' }, { status: 409 });
    }

    const supportList = await prisma.supportList.create({
      data: { name },
    });

    return NextResponse.json(supportList, { status: 201 });
  } catch (error) {
    console.error('POST /api/support-lists error:', error);
    return NextResponse.json({ error: 'Failed to create support list' }, { status: 500 });
  }
}

