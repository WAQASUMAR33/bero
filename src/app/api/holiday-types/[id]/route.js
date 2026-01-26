

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/holiday-types/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayTypeId = parseInt(id);

    const holidayType = await prisma.holidayType.findUnique({
      where: { id: holidayTypeId }
    });

    if (!holidayType) {
      return NextResponse.json({
        success: false,
        error: 'Holiday type not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: holidayType
    });
  } catch (error) {
    console.error('GET /holiday-types/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch holiday type',
      details: error.message
    }, { status: 500 });
  }
}

// PUT /api/holiday-types/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayTypeId = parseInt(id);
    const body = await request.json();

    const { name, description, isPaid, color } = body;

    const holidayType = await prisma.holidayType.update({
      where: { id: holidayTypeId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(isPaid !== undefined && { isPaid }),
        ...(color !== undefined && { color: color || null })
      }
    });

    return NextResponse.json({
      success: true,
      data: holidayType
    });
  } catch (error) {
    console.error('PUT /holiday-types/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Holiday type not found'
      }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Holiday type with this name already exists'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update holiday type',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE /api/holiday-types/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayTypeId = parseInt(id);

    // Check if holiday type is being used
    const holidaysCount = await prisma.holiday.count({
      where: { holidayTypeId: holidayTypeId }
    });

    if (holidaysCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete holiday type. It is being used by ${holidaysCount} holiday(s).`
      }, { status: 400 });
    }

    await prisma.holidayType.delete({
      where: { id: holidayTypeId }
    });

    return NextResponse.json({
      success: true,
      message: 'Holiday type deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /holiday-types/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Holiday type not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete holiday type',
      details: error.message
    }, { status: 500 });
  }
}



