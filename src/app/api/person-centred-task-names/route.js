import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET all person centred task names
export async function GET(request) {
  try {
    const names = await prisma.personCentredTaskName.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(names);
  } catch (error) {
    console.error('GET /person-centred-task-names error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person centred task names' },
      { status: 500 }
    );
  }
}

// POST - Create new person centred task name
export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Check if name already exists
    const existing = await prisma.personCentredTaskName.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Task name already exists' },
        { status: 409 }
      );
    }

    const taskName = await prisma.personCentredTaskName.create({
      data: { name }
    });

    return NextResponse.json(taskName, { status: 201 });
  } catch (error) {
    console.error('POST /person-centred-task-names error:', error);
    return NextResponse.json(
      { error: 'Failed to create person centred task name' },
      { status: 500 }
    );
  }
}

