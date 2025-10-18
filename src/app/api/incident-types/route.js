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

    const incidentTypes = await prisma.incidentType.findMany({
      orderBy: { type: 'asc' },
    });

    return NextResponse.json(incidentTypes);
  } catch (error) {
    console.error('GET /api/incident-types error:', error);
    return NextResponse.json({ error: 'Failed to fetch incident types' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, canEdit } = body;

    // Check if type already exists
    const existing = await prisma.incidentType.findUnique({
      where: { type }
    });

    if (existing) {
      return NextResponse.json({ error: 'This incident type already exists' }, { status: 409 });
    }

    const incidentType = await prisma.incidentType.create({
      data: { 
        type,
        canEdit: canEdit !== undefined ? canEdit : true
      },
    });

    return NextResponse.json(incidentType, { status: 201 });
  } catch (error) {
    console.error('POST /api/incident-types error:', error);
    return NextResponse.json({ error: 'Failed to create incident type' }, { status: 500 });
  }
}

