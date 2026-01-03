'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET /api/behaviour-tasks/[id]
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
    
    const task = await prisma.behaviourTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        trigger: true,
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
    console.error('GET /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch behaviour task' }, { status: 500 });
  }
}

// PUT /api/behaviour-tasks/[id]
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
    const existingTask = await prisma.behaviourTask.findUnique({
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
      // Care workers can only update: task data, notes, emotion
      if (body.type !== undefined) updateData.type = body.type;
      if (body.triggerId !== undefined) updateData.triggerId = body.triggerId ? parseInt(body.triggerId) : null;
      if (body.othersInvolved !== undefined) updateData.othersInvolved = body.othersInvolved;
      if (body.othersInvolvedDetails !== undefined) updateData.othersInvolvedDetails = body.othersInvolvedDetails || null;
      if (body.antecedents !== undefined) updateData.antecedents = body.antecedents || null;
      if (body.behaviour !== undefined) updateData.behaviour = body.behaviour || null;
      if (body.consequences !== undefined) updateData.consequences = body.consequences || null;
      if (body.careIntervention !== undefined) updateData.careIntervention = body.careIntervention || null;
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

    const updated = await prisma.behaviourTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        serviceSeeker: true,
        trigger: true,
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
    console.error('PUT /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update behaviour task' }, { status: 500 });
  }
}

// DELETE /api/behaviour-tasks/[id]
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

    await prisma.behaviourTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /behaviour-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete behaviour task' }, { status: 500 });
  }
}

