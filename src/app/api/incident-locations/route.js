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

    const locations = await prisma.incidentLocation.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('GET /api/incident-locations error:', error);
    return NextResponse.json({ error: 'Failed to fetch incident locations' }, { status: 500 });
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

    // Check if location already exists
    const existing = await prisma.incidentLocation.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'This location already exists' }, { status: 409 });
    }

    const location = await prisma.incidentLocation.create({
      data: { name },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('POST /api/incident-locations error:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

