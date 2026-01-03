'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET /api/comfort-check-tasks/[id]
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
    
    const task = await prisma.comfortCheckTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    });
    
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
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
    
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('GET /comfort-check-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch comfort check task' }, { status: 500 });
  }
}

// PUT /api/comfort-check-tasks/[id]
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
    const existingTask = await prisma.comfortCheckTask.findUnique({
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
      if (body.allNeedsMet !== undefined) updateData.allNeedsMet = body.allNeedsMet;
      if (body.catheterCheck !== undefined) updateData.catheterCheck = body.catheterCheck;
      if (body.incontinencePadCheck !== undefined) updateData.incontinencePadCheck = body.incontinencePadCheck;
      if (body.personalHygiene !== undefined) updateData.personalHygiene = body.personalHygiene;
      if (body.repositioned !== undefined) updateData.repositioned = body.repositioned;
      if (body.sleep !== undefined) updateData.sleep = body.sleep;
      if (body.stomaCheck !== undefined) updateData.stomaCheck = body.stomaCheck;
      if (body.toileted !== undefined) updateData.toileted = body.toileted;
      if (body.stoolPassed !== undefined) updateData.stoolPassed = body.stoolPassed;
      if (body.urinePassed !== undefined) updateData.urinePassed = body.urinePassed;
      if (body.notes !== undefined) updateData.notes = body.notes || null;
      if (body.completed !== undefined) updateData.completed = body.completed;
      if (body.emotion !== undefined) updateData.emotion = body.emotion;
      // Explicitly prevent updating serviceSeekerId, date, time
    } else {
      // Admins/managers can update all fields
      updateData = {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    }

    updateData.updatedById = decoded.userId;

    const updated = await prisma.comfortCheckTask.update({
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

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /comfort-check-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update comfort check task' }, { status: 500 });
  }
}

// DELETE /api/comfort-check-tasks/[id]
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

    await prisma.comfortCheckTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /comfort-check-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete comfort check task' }, { status: 500 });
  }
}

