import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/dashboard/events - Fetch upcoming events for dashboard
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get events for next 7 days
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const events = await prisma.serviceSeekerCalendarEntry.findMany({
      where: {
        date: {
          gte: today,
          lte: next7Days
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
        },
        careWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 10 // Limit to 10 upcoming events
    });

    const formattedEvents = events.map(event => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const timeStr = event.time || '';
      const timeDisplay = timeStr ? `${timeStr} - ${timeStr}` : 'All day';
      
      let title = '';
      let description = '';
      
      if (event.entryType === 'FAMILY_VISIT' || event.entryType === 'PROFESSIONAL_VISIT') {
        title = event.name || 'Visit';
        description = event.serviceSeeker 
          ? `${event.serviceSeeker.preferredName || `${event.serviceSeeker.firstName} ${event.serviceSeeker.lastName}`}`
          : '';
        if (event.relationship) {
          description += ` - ${event.relationship}`;
        }
        if (event.role) {
          description += ` - ${event.role}`;
        }
      } else if (event.entryType === 'EVENT') {
        title = 'Event';
        description = event.eventDescription || '';
      } else if (event.entryType === 'MEETING') {
        title = 'Meeting';
        description = event.about || '';
      } else {
        title = event.entryType;
        description = event.notes || '';
      }

      return {
        date: formattedDate,
        time: timeDisplay,
        title,
        description
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

