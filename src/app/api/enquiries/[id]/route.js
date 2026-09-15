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
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Error in GET /api/enquiries/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enquiry', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enquiryId = parseInt(id, 10);
    const body = await request.json();

    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    const updateData = {};
    if (body.property !== undefined) updateData.property = body.property?.trim() || null;
    if (body.potentialResidentName !== undefined) updateData.potentialResidentName = body.potentialResidentName.trim();
    if (body.dateReceived !== undefined) updateData.dateReceived = new Date(body.dateReceived);
    if (body.referralRoute !== undefined) updateData.referralRoute = body.referralRoute?.trim() || null;
    if (body.needs !== undefined) updateData.needs = body.needs?.trim() || null;
    if (body.hoursAllocatedPerDay !== undefined) updateData.hoursAllocatedPerDay = parseFloat(body.hoursAllocatedPerDay) || 0;
    if (body.costingProposed !== undefined) updateData.costingProposed = parseFloat(body.costingProposed) || 0;
    if (body.referer !== undefined) updateData.referer = body.referer?.trim() || null;
    if (body.refererContactDetails !== undefined) updateData.refererContactDetails = body.refererContactDetails?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status.toUpperCase();
    if (body.accepted !== undefined) updateData.accepted = Boolean(body.accepted);
    if (body.admittedDate !== undefined) updateData.admittedDate = body.admittedDate ? new Date(body.admittedDate) : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/enquiries/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update enquiry', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enquiryId = parseInt(id, 10);

    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    await prisma.enquiry.delete({ where: { id: enquiryId } });
    return NextResponse.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/enquiries/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete enquiry', details: error.message },
      { status: 500 }
    );
  }
}
