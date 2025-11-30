'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/holidays/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayId = parseInt(id);

    const holiday = await prisma.holiday.findUnique({
      where: { id: holidayId },
      include: {
        user: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            email: true
          }
        },
        holidayType: true,
        approvedBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        },
        createdBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        },
        updatedBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        }
      }
    });

    if (!holiday) {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('GET /holidays/[id] error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch holiday', 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT /api/holidays/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayId = parseInt(id);
    const body = await request.json();
    
    const {
      holidayTypeId,
      startDate,
      endDate,
      startTime,
      endTime,
      includeWeekends,
      description,
      holidayHours
    } = body;

    // Get existing holiday to check permissions
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id: holidayId }
    });

    if (!existingHoliday) {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    // Only allow editing if pending or if user is admin
    if (existingHoliday.status !== 'PENDING' && existingHoliday.userId !== decoded.userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot edit approved or rejected holidays' 
      }, { status: 403 });
    }

    const updateData = {
      updatedById: decoded.userId,
      ...(holidayTypeId && { holidayTypeId: parseInt(holidayTypeId) }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(startTime !== undefined && { startTime: startTime || null }),
      ...(endTime !== undefined && { endTime: endTime || null }),
      ...(includeWeekends !== undefined && { includeWeekends }),
      ...(description !== undefined && { description: description || null }),
      ...(holidayHours !== undefined && { holidayHours: parseFloat(holidayHours) })
    };

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: updateData,
      include: {
        user: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            email: true
          }
        },
        holidayType: true,
        updatedBy: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('PUT /holidays/[id] error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update holiday', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/holidays/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayId = parseInt(id);

    const holiday = await prisma.holiday.findUnique({
      where: { id: holidayId }
    });

    if (!holiday) {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    // Only allow deletion if pending or if user is admin
    if (holiday.status !== 'PENDING' && holiday.userId !== decoded.userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete approved or rejected holidays' 
      }, { status: 403 });
    }

    await prisma.holiday.delete({
      where: { id: holidayId }
    });

    return NextResponse.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /holidays/[id] error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete holiday', 
      details: error.message 
    }, { status: 500 });
  }
}



