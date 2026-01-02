import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/visits - Fetch visits for dashboard
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get visits (upcoming and recent past - last 7 days and next 30 days)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);
    endDate.setHours(23, 59, 59, 999);

    const visits = await prisma.serviceSeekerCalendarEntry.findMany({
      where: {
        entryType: {
          in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT']
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        serviceSeeker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            preferredName: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const formattedVisits = visits.map(visit => {
      const visitDate = new Date(visit.date);
      const formattedDate = visitDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      const formattedTime = visit.time || 'All day';
      
      const serviceUserName = visit.serviceSeeker 
        ? (visit.serviceSeeker.preferredName || `${visit.serviceSeeker.firstName} ${visit.serviceSeeker.lastName}`)
        : 'N/A';
      
      const visitTypeDisplay = visit.entryType === 'FAMILY_VISIT' ? 'Family Visit' : 'Professional Visit';
      
      const visitorInfo = visit.name || 'N/A';
      const additionalInfo = visit.entryType === 'FAMILY_VISIT' 
        ? (visit.relationship || '')
        : (visit.role || '');

      return {
        id: visit.id,
        date: formattedDate,
        rawDate: visit.date,
        time: formattedTime,
        type: visitTypeDisplay,
        serviceUserName,
        visitorName: visitorInfo,
        additionalInfo,
        purpose: visit.purpose || '',
        announced: visit.announced || null,
        completed: visit.completed || null
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedVisits
    });
  } catch (error) {
    console.error('Error fetching dashboard visits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}

