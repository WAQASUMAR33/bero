import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET single calendar entry
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const entry = await prisma.serviceSeekerCalendarEntry.findUnique({
      where: { id },
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

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Calendar entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('GET /calendar-entries/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar entry' },
      { status: 500 }
    );
  }
}

// PUT - Update calendar entry
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const {
      serviceSeekerId,
      entryType,
      date,
      time,
      chairedBy,
      about,
      notes,
      actions,
      concerns,
      invites,
      announced,
      name,
      relationship,
      role,
      purpose,
      summary,
      completed,
      careWorkerId,
      eventDescription
    } = body;

    const entry = await prisma.serviceSeekerCalendarEntry.update({
      where: { id },
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
    });
  } catch (error) {
    console.error('PUT /calendar-entries/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update calendar entry', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete calendar entry
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.serviceSeekerCalendarEntry.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar entry deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /calendar-entries/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete calendar entry' },
      { status: 500 }
    );
  }
}

