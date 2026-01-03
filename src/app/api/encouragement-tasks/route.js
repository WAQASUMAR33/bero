'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { generateEncouragementTasksFromSchedules } from '@/lib/generateEncouragementTasks';

// GET all encouragement tasks
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const dateParam = searchParams.get('date');
    
    // Determine the target date
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const where = {};
    let serviceSeekerIds = [];
    
    // For care workers, filter by shift assignments
    if (isCareWorker) {
      // Get shift assignments for this user on this date
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          userId: decoded.userId,
          date: targetDate,
          status: 'SCHEDULED'
        },
        include: {
          shift: {
            select: {
              serviceSeekerId: true
            }
          }
        }
      });

      // Extract unique service seeker IDs from assignments
      serviceSeekerIds = [...new Set(assignments.map(a => a.shift.serviceSeekerId))];
      
      if (serviceSeekerIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      
      where.serviceSeekerId = { in: serviceSeekerIds };
    } else if (serviceSeekerId) {
      // For non-care workers, allow filtering by serviceSeekerId if provided
      const id = parseInt(serviceSeekerId);
      serviceSeekerIds = [id];
      where.serviceSeekerId = id;
    } else {
      // No filter - get all service seekers (for admins)
      // We'll generate tasks for all schedules
      const allSchedules = await prisma.serviceSeekerEncouragementSchedule.findMany({
        select: { serviceSeekerId: true },
        distinct: ['serviceSeekerId'],
      });
      serviceSeekerIds = allSchedules.map(s => s.serviceSeekerId);
    }
    
    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: date,
        lt: nextDay
      };
    }

    // Generate tasks from schedules for the target date (if date is specified)
    if (dateParam && serviceSeekerIds.length > 0) {
      await generateEncouragementTasksFromSchedules(serviceSeekerIds, targetDate, decoded.userId);
    }

    const tasks = await prisma.encouragementTask.findMany({
      where,
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /encouragement-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encouragement tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new encouragement task
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is care worker or support worker - they cannot create tasks
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
        error: 'Care workers and support workers cannot create tasks. Tasks are created automatically from schedules.' 
      }, { status: 403 });
    }
    
    const body = await request.json();

    const {
      serviceSeekerId,
      date,
      time,
      encouragement,
      note,
      completed,
      emotion
    } = body;

    const task = await prisma.encouragementTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        encouragement,
        note: note || null,
        completed,
        emotion,
        createdById: decoded.userId,
        updatedById: decoded.userId
      },
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /encouragement-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create encouragement task' },
      { status: 500 }
    );
  }
}

