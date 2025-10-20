'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/shift-types
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const shiftTypes = await prisma.shiftType.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(shiftTypes);
  } catch (error) {
    console.error('GET /shift-types error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift types' }, { status: 500 });
  }
}

// POST /api/shift-types
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { name, careerPayRegular, careerPayBankHoliday, payCalculation } = body;

    if (!name || careerPayRegular === undefined || careerPayBankHoliday === undefined) {
      return NextResponse.json({ 
        error: 'name, careerPayRegular, and careerPayBankHoliday are required' 
      }, { status: 400 });
    }

    const shiftType = await prisma.shiftType.create({
      data: {
        name,
        careerPayRegular: parseFloat(careerPayRegular),
        careerPayBankHoliday: parseFloat(careerPayBankHoliday),
        payCalculation: payCalculation || 'PER_HOUR'
      }
    });

    return NextResponse.json(shiftType, { status: 201 });
  } catch (error) {
    console.error('POST /shift-types error:', error);
    return NextResponse.json({ error: 'Failed to create shift type' }, { status: 500 });
  }
}

