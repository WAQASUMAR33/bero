'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// DELETE person centred task name
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

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
