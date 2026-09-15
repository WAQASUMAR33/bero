import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const totalCount = await prisma.enquiry.count();
    if (totalCount === 0) {
      await prisma.enquiry.createMany({
        data: [
          {
            property: 'Oakwood Lodge',
            potentialResidentName: 'Arthur Pendelton',
            dateReceived: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            referralRoute: 'Local Authority (Adult Social Care)',
            needs: '1:1 assistance with morning personal care, medication prompts, mobility support using walking frame.',
            hoursAllocatedPerDay: 4.0,
            costingProposed: 95.0,
            referer: 'Sarah Jenkins (Social Worker)',
            refererContactDetails: '07123 456789 / s.jenkins@council.gov.uk',
            status: 'LIVE',
            accepted: false,
            createdById: currentUser.id,
          },
          {
            property: 'Maple House',
            potentialResidentName: 'Evelyn Wright',
            dateReceived: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            referralRoute: 'Hospital Discharge Team (St. Thomas)',
            needs: 'Post-stroke rehabilitation support, meal preparation, companionship, catheter care checks.',
            hoursAllocatedPerDay: 6.0,
            costingProposed: 140.0,
            referer: 'David Miller (Discharge Coordinator)',
            refererContactDetails: '020 7982 1100 / d.miller@nhs.net',
            status: 'LIVE',
            accepted: false,
            createdById: currentUser.id,
          },
          {
            property: 'Rose Cottage',
            potentialResidentName: 'Thomas Higgins',
            dateReceived: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            referralRoute: 'Private Family Direct Referral',
            needs: 'Dementia care stage 2, night sitting service, emotional support for spouse, meal reminders.',
            hoursAllocatedPerDay: 8.0,
            costingProposed: 195.0,
            referer: 'Margaret Higgins (Daughter)',
            refererContactDetails: '07789 123456 / m.higgins@gmail.com',
            status: 'HELD',
            accepted: false,
            notes: 'Awaiting family decision on start date pending home alterations.',
            createdById: currentUser.id,
          },
          {
            property: 'Oakwood Lodge',
            potentialResidentName: 'Margaret Davies',
            dateReceived: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            referralRoute: 'Continuing Healthcare (CHC)',
            needs: 'Full 24/7 complex package, PEG feeding, palliative support.',
            hoursAllocatedPerDay: 12.0,
            costingProposed: 320.0,
            referer: 'Clinical Commissioning Group',
            refererContactDetails: 'chc.referrals@icb.nhs.uk',
            status: 'CLOSED',
            accepted: true,
            admittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            notes: 'Agreed care plan and admitted into service.',
            createdById: currentUser.id,
          }
        ]
      });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'LIVE'; // LIVE, HELD, CLOSED, ALL
    const search = searchParams.get('search') || '';
    const property = searchParams.get('property') || '';

    const where = {};

    if (statusParam && statusParam.toUpperCase() !== 'ALL') {
      where.status = statusParam.toUpperCase();
    }

    if (property && property !== 'all') {
      where.property = property;
    }

    if (search.trim()) {
      where.OR = [
        { potentialResidentName: { contains: search.trim() } },
        { referer: { contains: search.trim() } },
        { property: { contains: search.trim() } },
        { referralRoute: { contains: search.trim() } },
        { needs: { contains: search.trim() } }
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: [
        { dateReceived: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Counts for live, held, closed tabs
    const [liveCount, heldCount, closedCount] = await Promise.all([
      prisma.enquiry.count({ where: { status: 'LIVE' } }),
      prisma.enquiry.count({ where: { status: 'HELD' } }),
      prisma.enquiry.count({ where: { status: 'CLOSED' } }),
    ]);

    // Unique properties list for filters
    const allEnquiries = await prisma.enquiry.findMany({
      select: { property: true },
      where: { property: { not: null } }
    });
    const uniqueProperties = Array.from(new Set(allEnquiries.map(e => e.property).filter(Boolean)));

    return NextResponse.json({
      success: true,
      data: {
        enquiries,
        counts: {
          live: liveCount,
          held: heldCount,
          closed: closedCount,
          total: liveCount + heldCount + closedCount,
        },
        properties: uniqueProperties,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/enquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enquiries', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      property,
      potentialResidentName,
      dateReceived,
      referralRoute,
      needs,
      hoursAllocatedPerDay,
      costingProposed,
      referer,
      refererContactDetails,
      status = 'LIVE',
      accepted = false,
      admittedDate,
      notes
    } = body;

    if (!potentialResidentName?.trim()) {
      return NextResponse.json({ success: false, error: 'Potential Resident Name is required' }, { status: 400 });
    }

    const newEnquiry = await prisma.enquiry.create({
      data: {
        property: property?.trim() || null,
        potentialResidentName: potentialResidentName.trim(),
        dateReceived: dateReceived ? new Date(dateReceived) : new Date(),
        referralRoute: referralRoute?.trim() || null,
        needs: needs?.trim() || null,
        hoursAllocatedPerDay: hoursAllocatedPerDay ? parseFloat(hoursAllocatedPerDay) : 0,
        costingProposed: costingProposed ? parseFloat(costingProposed) : 0,
        referer: referer?.trim() || null,
        refererContactDetails: refererContactDetails?.trim() || null,
        status: status?.toUpperCase() || 'LIVE',
        accepted: Boolean(accepted),
        admittedDate: admittedDate ? new Date(admittedDate) : null,
        notes: notes?.trim() || null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: newEnquiry });
  } catch (error) {
    console.error('Error in POST /api/enquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create enquiry', details: error.message },
      { status: 500 }
    );
  }
}
