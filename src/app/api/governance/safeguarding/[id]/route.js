import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const item = await prisma.safeguardingTracker.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error in GET /api/governance/safeguarding/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const recordId = parseInt(id, 10);
    const body = await request.json();

    const data = {};
    if (body.incidentDate !== undefined) data.incidentDate = body.incidentDate ? new Date(body.incidentDate) : null;
    if (body.serviceUser !== undefined) data.serviceUser = body.serviceUser;
    if (body.location !== undefined) data.location = body.location;
    if (body.dateReported !== undefined) data.dateReported = body.dateReported ? new Date(body.dateReported) : null;
    if (body.localAuthority !== undefined) data.localAuthority = body.localAuthority;
    if (body.reportedBy !== undefined) data.reportedBy = body.reportedBy;
    if (body.details !== undefined) data.details = body.details;
    if (body.actionsTaken !== undefined) data.actionsTaken = body.actionsTaken;
    if (body.outcome !== undefined) data.outcome = body.outcome;
    if (body.rcaCompleted !== undefined) data.rcaCompleted = Boolean(body.rcaCompleted);
    if (body.investigationCompleted !== undefined) data.investigationCompleted = Boolean(body.investigationCompleted);
    if (body.lessonsLearntCompleted !== undefined) data.lessonsLearntCompleted = Boolean(body.lessonsLearntCompleted);
    if (body.comments !== undefined) data.comments = body.comments;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === 'CLOSED' && !body.dateClosed) {
        data.dateClosed = new Date();
      } else if (body.dateClosed !== undefined) {
        data.dateClosed = body.dateClosed ? new Date(body.dateClosed) : null;
      }
    }

    const updated = await prisma.safeguardingTracker.update({
      where: { id: recordId },
      data,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Safeguarding record updated' });
  } catch (error) {
    console.error('Error in PUT /api/governance/safeguarding/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.safeguardingTracker.delete({
      where: { id: parseInt(id, 10) }
    });

    return NextResponse.json({ success: true, message: 'Safeguarding record deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/governance/safeguarding/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
