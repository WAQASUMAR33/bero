

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/holiday-types
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const holidayTypes = await prisma.holidayType.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: holidayTypes
    });
  } catch (error) {
    console.error('GET /holiday-types error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch holiday types',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/holiday-types
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const { name, description, isPaid, color } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }

    const holidayType = await prisma.holidayType.create({
      data: {
        name,
        description: description || null,
        isPaid: isPaid !== undefined ? isPaid : true,
        color: color || null
      }
    });

    return NextResponse.json({
      success: true,
      data: holidayType
    }, { status: 201 });
  } catch (error) {
    console.error('POST /holiday-types error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Holiday type with this name already exists'
      }, { status: 400 });
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create holiday type',
      details: error.message
    }, { status: 500 });
  }
}



