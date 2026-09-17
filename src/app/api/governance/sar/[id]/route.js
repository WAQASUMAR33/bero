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
    const item = await prisma.sarTracker.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error in GET /api/governance/sar/[id]:', error);
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
    if (body.dateReceived !== undefined) data.dateReceived = body.dateReceived ? new Date(body.dateReceived) : null;
    if (body.dateAcknowledged !== undefined) data.dateAcknowledged = body.dateAcknowledged ? new Date(body.dateAcknowledged) : null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.receivedFrom !== undefined) data.receivedFrom = body.receivedFrom;
    if (body.subjectName !== undefined) data.subjectName = body.subjectName;
    if (body.informationRequested !== undefined) data.informationRequested = body.informationRequested;
    if (body.formatReceived !== undefined) data.formatReceived = body.formatReceived;
    if (body.formatRequested !== undefined) data.formatRequested = body.formatRequested;
    if (body.purpose !== undefined) data.purpose = body.purpose;
    if (body.requestGranted !== undefined) data.requestGranted = body.requestGranted;
    if (body.outcomeReason !== undefined) data.outcomeReason = body.outcomeReason;
    if (body.dateInformationSent !== undefined) data.dateInformationSent = body.dateInformationSent ? new Date(body.dateInformationSent) : null;
    if (body.handledBy !== undefined) data.handledBy = body.handledBy;
    if (body.comments !== undefined) data.comments = body.comments;
    if (body.status !== undefined) {
      data.status = body.status;
      if (['COMPLETED', 'REJECTED'].includes(body.status) && !body.dateClosed) {
        data.dateClosed = new Date();
      } else if (body.dateClosed !== undefined) {
        data.dateClosed = body.dateClosed ? new Date(body.dateClosed) : null;
      }
    }

    const updated = await prisma.sarTracker.update({
      where: { id: recordId },
      data,
    });

    return NextResponse.json({ success: true, data: updated, message: 'SAR record updated' });
  } catch (error) {
    console.error('Error in PUT /api/governance/sar/[id]:', error);
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
    await prisma.sarTracker.delete({
      where: { id: parseInt(id, 10) }
    });

    return NextResponse.json({ success: true, message: 'SAR record deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/governance/sar/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
