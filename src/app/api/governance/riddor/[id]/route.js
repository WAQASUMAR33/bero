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
    const item = await prisma.riddorTracker.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error in GET /api/governance/riddor/[id]:', error);
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
    if (body.affectedPersonType !== undefined) data.affectedPersonType = body.affectedPersonType;
    if (body.affectedPersonName !== undefined) data.affectedPersonName = body.affectedPersonName;
    if (body.location !== undefined) data.location = body.location;
    if (body.dateReported !== undefined) data.dateReported = body.dateReported ? new Date(body.dateReported) : null;
    if (body.reportedBy !== undefined) data.reportedBy = body.reportedBy;
    if (body.hseReferenceNumber !== undefined) data.hseReferenceNumber = body.hseReferenceNumber;
    if (body.details !== undefined) data.details = body.details;
    if (body.actionsTaken !== undefined) data.actionsTaken = body.actionsTaken;
    if (body.outcome !== undefined) data.outcome = body.outcome;
    if (body.rcaCompleted !== undefined) data.rcaCompleted = Boolean(body.rcaCompleted);
    if (body.cqcNotified !== undefined) data.cqcNotified = Boolean(body.cqcNotified);
    if (body.safeguardingNotified !== undefined) data.safeguardingNotified = Boolean(body.safeguardingNotified);
    if (body.ipcNotified !== undefined) data.ipcNotified = Boolean(body.ipcNotified);
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

    const updated = await prisma.riddorTracker.update({
      where: { id: recordId },
      data,
    });

    return NextResponse.json({ success: true, data: updated, message: 'RIDDOR record updated' });
  } catch (error) {
    console.error('Error in PUT /api/governance/riddor/[id]:', error);
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
    await prisma.riddorTracker.delete({
      where: { id: parseInt(id, 10) }
    });

    return NextResponse.json({ success: true, message: 'RIDDOR record deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/governance/riddor/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
