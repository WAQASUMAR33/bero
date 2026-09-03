import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/service-users - Fetch service users for dashboard
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const serviceUsers = await prisma.serviceSeeker.findMany({
      where: {
        status: { notIn: ['ARCHIVED', 'ARCHIVED_PRE_ADMISSION'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        status: true,
        createdAt: true,
        dateOfBirth: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent
    });

    const formattedServiceUsers = serviceUsers.map(user => {
      const dateIn = new Date(user.createdAt);
      const formattedDate = dateIn.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      // Determine status display
      let statusDisplay = 'Confirmed';
      let statusColor = 'text-blue-600';
      
      if (user.status === 'LIVE') {
        statusDisplay = 'Confirmed';
        statusColor = 'text-blue-600';
      } else if (user.status === 'PENDING') {
        statusDisplay = 'Incoming';
        statusColor = 'text-orange-600';
      } else if (user.status === 'INACTIVE' || user.status === 'ARCHIVED') {
        statusDisplay = 'Cancelled';
        statusColor = 'text-red-600';
      }

      return {
        name: user.preferredName || `${user.firstName} ${user.lastName}`,
        dateIn: formattedDate,
        symptoms: user.status || 'N/A', // Using status as placeholder for symptoms
        status: statusDisplay,
        statusColor
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedServiceUsers
    });
  } catch (error) {
    console.error('Error fetching service users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service users' },
      { status: 500 }
    );
  }
}

