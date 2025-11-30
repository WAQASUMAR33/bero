'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST /api/holidays/[id]/reject
export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const holidayId = parseInt(id);
    const body = await request.json();
    
    const { rejectionReason } = body;

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: {
        status: 'REJECTED',
        approvedById: decoded.userId,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
        updatedById: decoded.userId
      },
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: holiday,
      message: 'Holiday rejected successfully'
    });
  } catch (error) {
    console.error('POST /holidays/[id]/reject error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Holiday not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to reject holiday', 
      details: error.message 
    }, { status: 500 });
  }
}



