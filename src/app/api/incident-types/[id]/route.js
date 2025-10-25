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
    const typeId = parseInt(id);

    // Check if incident type can be edited/deleted
    const incidentType = await prisma.incidentType.findUnique({ where: { id: typeId } });
    if (incidentType && !incidentType.canEdit) {
      return NextResponse.json({ error: 'This default incident type cannot be deleted' }, { status: 400 });
    }

    // Check if incident type is in use
    const tasksUsingThis = await prisma.incidentFallTask.count({
      where: { incidentTypeId: typeId }
    });

    if (tasksUsingThis > 0) {
      return NextResponse.json({ 
        error: `Cannot delete this incident type. It is being used in ${tasksUsingThis} task(s).` 
      }, { status: 400 });
    }

    await prisma.incidentType.delete({ where: { id: typeId } });

    return NextResponse.json({ message: 'Incident type deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/incident-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete incident type' }, { status: 500 });
  }
}

