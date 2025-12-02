import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all calendar entries
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const entryType = searchParams.get('entryType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};
    
    if (serviceSeekerId) {
      where.serviceSeekerId = parseInt(serviceSeekerId);
    }
    
    if (entryType) {
      where.entryType = entryType;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const entries = await prisma.serviceSeekerCalendarEntry.findMany({
      where,
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
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('GET /calendar-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar entries' },
      { status: 500 }
    );
  }
}

// POST - Create new calendar entry
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const {
      serviceSeekerId,
      entryType,
      date,
      time,
      // Meeting fields
      chairedBy,
      about,
      notes,
      actions,
      concerns,
      invites,
      // Visit fields
      announced,
      name,
      relationship,
      role,
      purpose,
      summary,
      completed,
      // Event fields
      careWorkerId,
      eventDescription
    } = body;

    const entry = await prisma.serviceSeekerCalendarEntry.create({
      data: {
        serviceSeekerId: serviceSeekerId ? parseInt(serviceSeekerId) : null,
        entryType,
        date: new Date(date),
        time: time || null,
        chairedBy: chairedBy || null,
        about: about || null,
        notes: notes || null,
        actions: actions || null,
        concerns: concerns || null,
        invites: invites ? JSON.parse(JSON.stringify(invites)) : null,
        announced: announced || null,
        name: name || null,
        relationship: relationship || null,
        role: role || null,
        purpose: purpose || null,
        summary: summary || null,
        completed: completed || null,
        careWorkerId: careWorkerId ? parseInt(careWorkerId) : null,
        eventDescription: eventDescription || null,
        createdById: decoded.userId,
        updatedById: decoded.userId
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

    return NextResponse.json({
      success: true,
      data: entry
    }, { status: 201 });
  } catch (error) {
    console.error('POST /calendar-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create calendar entry', details: error.message },
      { status: 500 }
    );
  }
}

