'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// DELETE /api/behaviour-triggers/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const triggerId = parseInt(id);

    // Check if trigger is being used
    const tasksUsingTrigger = await prisma.behaviourTask.count({
      where: { triggerId: triggerId }
    });

    if (tasksUsingTrigger > 0) {
      return NextResponse.json({ 
        error: `Cannot delete trigger: it is being used by ${tasksUsingTrigger} behaviour task(s)` 
      }, { status: 400 });
    }

    await prisma.behaviourTrigger.delete({ where: { id: triggerId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /behaviour-triggers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete behaviour trigger' }, { status: 500 });
  }
}

