'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single spending/money task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.spendingMoneyTask.findUnique({
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
        { error: 'Spending/money task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /spending-money-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending/money task' },
      { status: 500 }
    );
  }
}

// PUT - Update spending/money task
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();
    const {
      serviceSeekerId: parseInt(serviceSeekerId),
      date,
      time,
      type,
      amount,
      paidUsing,
      receiptUrl,
      notes,
      emotion
    } = body;

    const task = await prisma.spendingMoneyTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        type,
        amount: parseFloat(amount),
        paidUsing,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        emotion,
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

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /spending-money-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update spending/money task' },
      { status: 500 }
    );
  }
}

// DELETE spending/money task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.spendingMoneyTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: 'Spending/money task deleted successfully' });
  } catch (error) {
    console.error('DELETE /spending-money-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete spending/money task' },
      { status: 500 }
    );
  }
}

