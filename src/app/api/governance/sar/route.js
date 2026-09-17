import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Seed sample records if empty
    const count = await prisma.sarTracker.count();
    if (count === 0) {
      const now = Date.now();
      await prisma.sarTracker.createMany({
        data: [
          {
            dateReceived: new Date(now - 12 * 24 * 60 * 60 * 1000),
            dateAcknowledged: new Date(now - 11 * 24 * 60 * 60 * 1000),
            dueDate: new Date(now + 18 * 24 * 60 * 60 * 1000), // 30 days statutory window
            receivedFrom: 'Taylor & Sons Solicitors (Acting on behalf of Arthur Pendelton)',
            subjectName: 'Arthur Pendelton',
            informationRequested: 'Full care plans, daily observation logs, and risk assessments between Jan 2026 and Aug 2026.',
            formatReceived: 'Email (Formal Legal Letter Attachment)',
            formatRequested: 'Electronic (Encrypted PDF via Secure Email)',
            purpose: 'Continuing healthcare funding review and power of attorney audit.',
            requestGranted: 'PARTIAL',
            outcomeReason: 'Granted care notes and care plans. Third-party personal names redacted in line with UK GDPR Section 45 / Data Protection Act 2018.',
            dateInformationSent: new Date(now - 3 * 24 * 60 * 60 * 1000),
            handledBy: 'Hannah Vance (Information Governance Lead)',
            comments: 'Signed client authorization consent mandate verified prior to disclosure.',
            status: 'COMPLETED',
            dateClosed: new Date(now - 3 * 24 * 60 * 60 * 1000),
            createdById: currentUser.id,
          },
          {
            dateReceived: new Date(now - 4 * 24 * 60 * 60 * 1000),
            dateAcknowledged: new Date(now - 3 * 24 * 60 * 60 * 1000),
            dueDate: new Date(now + 26 * 24 * 60 * 60 * 1000),
            receivedFrom: 'Margaret Higgins (Daughter / Appointee)',
            subjectName: 'Thomas Higgins',
            informationRequested: 'Medication administration records (MAR charts) and weight monitoring logs for the last 3 months.',
            formatReceived: 'Signed Paper Form delivered to Head Office',
            formatRequested: 'Hardcopy (Certified copies for collection)',
            purpose: 'Family health review and discussion with consultant geriatrician.',
            requestGranted: 'PENDING',
            outcomeReason: 'Under review by Registered Manager and Caldicott Guardian.',
            dateInformationSent: null,
            handledBy: 'Hannah Vance (Information Governance Lead)',
            comments: 'Proof of ID verified. File collation in progress.',
            status: 'IN_PROGRESS',
            createdById: currentUser.id,
          }
        ]
      });
    }

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      where.OR = [
        { subjectName: { contains: search } },
        { receivedFrom: { contains: search } },
        { handledBy: { contains: search } },
        { informationRequested: { contains: search } },
        { purpose: { contains: search } },
      ];
    }

    const [items, totalCount, openCount, inProgressCount, completedCount] = await Promise.all([
      prisma.sarTracker.findMany({
        where,
        orderBy: { dateReceived: 'desc' },
      }),
      prisma.sarTracker.count(),
      prisma.sarTracker.count({ where: { status: 'OPEN' } }),
      prisma.sarTracker.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.sarTracker.count({ where: { status: 'COMPLETED' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        counts: {
          total: totalCount,
          open: openCount,
          inProgress: inProgressCount,
          completed: completedCount,
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/governance/sar:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.subjectName) {
      return NextResponse.json({ success: false, error: 'Subject Name is required' }, { status: 400 });
    }

    const receivedDate = body.dateReceived ? new Date(body.dateReceived) : new Date();
    // Default statutory due date is 1 month (30 days) from date received
    const defaultDueDate = new Date(receivedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const item = await prisma.sarTracker.create({
      data: {
        dateReceived: receivedDate,
        dateAcknowledged: body.dateAcknowledged ? new Date(body.dateAcknowledged) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : defaultDueDate,
        receivedFrom: body.receivedFrom || null,
        subjectName: body.subjectName,
        informationRequested: body.informationRequested || null,
        formatReceived: body.formatReceived || 'Email',
        formatRequested: body.formatRequested || 'Electronic (PDF)',
        purpose: body.purpose || null,
        requestGranted: body.requestGranted || 'PENDING',
        outcomeReason: body.outcomeReason || null,
        dateInformationSent: body.dateInformationSent ? new Date(body.dateInformationSent) : null,
        handledBy: body.handledBy || null,
        comments: body.comments || null,
        status: body.status || 'OPEN',
        dateClosed: body.dateClosed ? new Date(body.dateClosed) : null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: item, message: 'Subject Access Request logged successfully' });
  } catch (error) {
    console.error('Error in POST /api/governance/sar:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
