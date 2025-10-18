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

// DELETE person centred task name
export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the name is being used by any tasks
    const tasksUsingName = await prisma.personCentredTask.count({
      where: { nameId: id }
    });

    if (tasksUsingName > 0) {
      return NextResponse.json(
        { error: 'Cannot delete task name as it is being used by existing tasks' },
        { status: 400 }
      );
    }

    await prisma.personCentredTaskName.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Person centred task name deleted successfully' });
  } catch (error) {
    console.error('DELETE /person-centred-task-names/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete person centred task name' },
      { status: 500 }
    );
  }
}

