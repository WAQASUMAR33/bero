'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET single oral care task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user role to check if care worker
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    const isCareWorker = userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER';

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.oralCareTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Oral care task not found' },
        { status: 404 }
      );
    }

    // For care workers, verify they have a shift assignment for this service user
    if (isCareWorker) {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: taskDate,
          status: 'SCHEDULED',
          shift: {
            serviceSeekerId: task.serviceSeekerId
          }
        }
      });
      
      if (!assignment) {
        return NextResponse.json({ 
          error: 'You do not have permission to view this task. You are not assigned to this service user.' 
        }, { status: 403 });
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch oral care task' },
      { status: 500 }
    );
  }
}

// PUT - Update oral care task
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user role to check if care worker
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    const isCareWorker = userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER';

    const { id } = await params;
    const taskId = parseInt(id);
    
    // Get existing task to verify permissions
    const existingTask = await prisma.oralCareTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // For care workers, verify they have a shift assignment for this service user
    if (isCareWorker) {
      const taskDate = new Date(existingTask.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: taskDate,
          status: 'SCHEDULED',
          shift: {
            serviceSeekerId: existingTask.serviceSeekerId
          }
        }
      });
      
      if (!assignment) {
        return NextResponse.json({ 
          error: 'You do not have permission to update this task. You are not assigned to this service user.' 
        }, { status: 403 });
      }
    }

    const body = await request.json();

    // For care workers, only allow updating specific fields (not serviceSeekerId, date, time)
    let updateData = {};
    
    if (isCareWorker) {
      // Care workers can only update: task data, notes, completed, emotion
      if (body.oralCare !== undefined) updateData.oralCare = body.oralCare;
      if (body.assisted !== undefined) updateData.assisted = body.assisted;
      if (body.notes !== undefined) updateData.notes = body.notes || null;
      if (body.compliance !== undefined) updateData.compliance = body.compliance;
      if (body.completed !== undefined) updateData.completed = body.completed;
      if (body.emotion !== undefined) updateData.emotion = body.emotion;
      // Explicitly prevent updating serviceSeekerId, date, time
    } else {
      // Admins/managers can update all fields
      updateData = {
        serviceSeekerId: body.serviceSeekerId ? parseInt(body.serviceSeekerId) : undefined,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time !== undefined ? (body.time || null) : undefined,
        oralCare: body.oralCare,
        assisted: body.assisted,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
        compliance: body.compliance,
        completed: body.completed,
        emotion: body.emotion,
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    }

    updateData.updatedById = decoded.userId;

    const task = await prisma.oralCareTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update oral care task' },
      { status: 500 }
    );
  }
}

// DELETE oral care task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is care worker or support worker - they cannot delete tasks
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    if (userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER') {
      return NextResponse.json({ 
        error: 'Care workers and support workers cannot delete tasks.' 
      }, { status: 403 });
    }

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.oralCareTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Oral care task deleted successfully' });
  } catch (error) {
    console.error('DELETE /oral-care-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete oral care task' },
      { status: 500 }
    );
  }
}
