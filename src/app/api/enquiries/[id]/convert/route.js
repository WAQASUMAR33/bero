import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enquiryId = parseInt(id, 10);
    const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });

    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const targetStatus = body.status === 'LIVE' ? 'LIVE' : 'PRE_ADMISSION';

    // Parse resident name into first and last name
    const rawName = (enquiry.potentialResidentName || '').trim();
    const parts = rawName.split(' ');
    const firstName = parts[0] || 'New';
    const lastName = parts.slice(1).join(' ') || 'Resident';

    // Create ServiceSeeker
    const newServiceSeeker = await prisma.serviceSeeker.create({
      data: {
        firstName,
        lastName,
        title: body.title || 'Client',
        status: targetStatus,
        address: enquiry.property || null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
        admission: {
          create: {
            startDate: new Date(),
            hoursPerDay: enquiry.hoursAllocatedPerDay || null,
            addressLine1: enquiry.property || null,
            medicalHistory: enquiry.needs || null,
          }
        },
        confidentialNotes: {
          create: {
            noteDate: new Date(),
            staffName: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'System',
            notes: `Converted from Enquiry #${enquiry.id}. Route: ${enquiry.referralRoute || 'N/A'}. Referrer: ${enquiry.referer || 'N/A'} (${enquiry.refererContactDetails || 'N/A'}). Needs: ${enquiry.needs || 'N/A'}. Proposed Hours/Day: ${enquiry.hoursAllocatedPerDay || 'N/A'}. Proposed Costing: £${enquiry.costingProposed || 'N/A'}.`
          }
        }
      }
    });

    // Update enquiry record
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        accepted: true,
        admittedDate: new Date(),
        status: 'CLOSED',
        serviceSeekerId: newServiceSeeker.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Enquiry successfully converted to Service User (${firstName} ${lastName})`,
      data: {
        serviceSeeker: newServiceSeeker,
        enquiry: updatedEnquiry,
      }
    });
  } catch (error) {
    console.error('Error in POST /api/enquiries/[id]/convert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to convert enquiry to service user', details: error.message },
      { status: 500 }
    );
  }
}
