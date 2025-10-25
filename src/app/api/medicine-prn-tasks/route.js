'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET all medicine PRN tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const tasks = await prisma.medicinePrnTask.findMany({
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
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
    console.error('GET /medicine-prn-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicine PRN tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new medicine PRN task
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();
    const {
      serviceSeekerId,
      applyDate,
      applyTime,
      prn,
      medicineName,
      medicineType,
      administrated,
      notes,
      requestSignoffBy,
      signoffByStaffId,
      completed,
      emotion
    } = body;

    const task = await prisma.medicinePrnTask.create({
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        applyDate: new Date(applyDate),
        applyTime,
        prn,
        medicineName,
        medicineType,
        administrated,
        notes: notes || null,
        requestSignoffBy,
        signoffByStaffId: requestSignoffBy === 'REQUIRED' ? parseInt(signoffByStaffId) : null,
        completed,
        emotion,
        createdById: decoded.userId,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: true,
        signoffByStaff: {
          select: { id: true, firstName: true, lastName: true }
        },
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
    console.error('POST /medicine-prn-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create medicine PRN task' },
      { status: 500 }
    );
  }
}

