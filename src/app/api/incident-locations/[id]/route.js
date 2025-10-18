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

export async function DELETE(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if location is in use
    const tasksUsingThis = await prisma.incidentFallTask.count({
      where: { locationId: id }
    });

    if (tasksUsingThis > 0) {
      return NextResponse.json({ 
        error: `Cannot delete this location. It is being used in ${tasksUsingThis} task(s).` 
      }, { status: 400 });
    }

    await prisma.incidentLocation.delete({ where: { id } });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/incident-locations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}

