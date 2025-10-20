'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/shift-types/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const shiftType = await prisma.shiftType.findUnique({
      where: { id }
    });

    if (!shiftType) {
      return NextResponse.json({ error: 'Shift type not found' }, { status: 404 });
    }

    return NextResponse.json(shiftType);
  } catch (error) {
    console.error('GET /shift-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift type' }, { status: 500 });
  }
}

// PUT /api/shift-types/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    const body = await request.json();
    const { name, careerPayRegular, careerPayBankHoliday, payCalculation } = body;

    const shiftType = await prisma.shiftType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(careerPayRegular !== undefined && { careerPayRegular: parseFloat(careerPayRegular) }),
        ...(careerPayBankHoliday !== undefined && { careerPayBankHoliday: parseFloat(careerPayBankHoliday) }),
        ...(payCalculation && { payCalculation })
      }
    });

    return NextResponse.json(shiftType);
  } catch (error) {
    console.error('PUT /shift-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update shift type' }, { status: 500 });
  }
}

// DELETE /api/shift-types/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = params;
    await prisma.shiftType.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Shift type deleted successfully' });
  } catch (error) {
    console.error('DELETE /shift-types/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete shift type' }, { status: 500 });
  }
}

