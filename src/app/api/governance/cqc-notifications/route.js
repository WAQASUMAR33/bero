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
    const location = searchParams.get('location');
    const search = searchParams.get('search');

    // Seed realistic sample records if empty
    const count = await prisma.cqcNotificationTracker.count();
    if (count === 0) {
      await prisma.cqcNotificationTracker.createMany({
        data: [
          {
            incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            notificationType: 'Serious Injury',
            location: 'Oakwood Lodge',
            serviceUserInitials: 'A.P.',
            dateSent: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            reportedBy: 'Jane Miller (Registered Manager)',
            companyNotificationId: 'NOTIF-2026-001',
            cqcNotificationNumber: 'CQC-1098234-A',
            details: 'Service user sustained a superficial scalp laceration following an unwitnessed slip in bedroom. First aid applied and paramedic assessment completed.',
            actionsTaken: 'Wound dressed, 48-hr neurological observations completed without abnormality. Sensor mat repositioned beside bed.',
            outcome: 'Service user fully recovered, mobility plan updated.',
            rcaCompleted: true,
            safeguardingNotified: false,
            investigationCompleted: true,
            lessonsLearntCompleted: true,
            localAuthority: 'Hertfordshire County Council',
            comments: 'CQC acknowledged receipt with no further enquiries requested.',
            status: 'CLOSED',
            dateClosed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            createdById: currentUser.id,
          },
          {
            incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notificationType: 'Abuse or Allegation of Abuse',
            location: 'Maple House',
            serviceUserInitials: 'E.W.',
            dateSent: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            reportedBy: 'Mark Stevens (Deputy Manager)',
            companyNotificationId: 'NOTIF-2026-002',
            cqcNotificationNumber: 'CQC-1098551-B',
            details: 'Allegation of verbal hostility made by service user regarding night care worker conduct during change of shift.',
            actionsTaken: 'Staff member immediately suspended without prejudice pending full disciplinary investigation. Safeguarding referral submitted.',
            outcome: 'Investigation actively underway with local authority safeguarding triage team.',
            rcaCompleted: false,
            safeguardingNotified: true,
            investigationCompleted: false,
            lessonsLearntCompleted: false,
            localAuthority: 'Essex County Council',
            comments: 'Initial strategy meeting scheduled for tomorrow.',
            status: 'OPEN',
            createdById: currentUser.id,
          }
        ]
      });
    }

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (location && location !== 'all') {
      where.location = location;
    }
    if (search && search.trim()) {
      where.OR = [
        { serviceUserInitials: { contains: search } },
        { location: { contains: search } },
        { notificationType: { contains: search } },
        { companyNotificationId: { contains: search } },
        { cqcNotificationNumber: { contains: search } },
        { details: { contains: search } },
        { localAuthority: { contains: search } },
      ];
    }

    const [items, totalCount, openCount, underReviewCount, closedCount, locations] = await Promise.all([
      prisma.cqcNotificationTracker.findMany({
        where,
        orderBy: { incidentDate: 'desc' },
      }),
      prisma.cqcNotificationTracker.count(),
      prisma.cqcNotificationTracker.count({ where: { status: 'OPEN' } }),
      prisma.cqcNotificationTracker.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.cqcNotificationTracker.count({ where: { status: 'CLOSED' } }),
      prisma.cqcNotificationTracker.findMany({
        select: { location: true },
        distinct: ['location'],
        where: { location: { not: null } }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        counts: {
          total: totalCount,
          open: openCount,
          underReview: underReviewCount,
          closed: closedCount,
        },
        locations: locations.map(l => l.location).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/governance/cqc-notifications:', error);
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
    if (!body.notificationType) {
      return NextResponse.json({ success: false, error: 'Notification Type is required' }, { status: 400 });
    }

    const item = await prisma.cqcNotificationTracker.create({
      data: {
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
        notificationType: body.notificationType,
        location: body.location || null,
        serviceUserInitials: body.serviceUserInitials || null,
        dateSent: body.dateSent ? new Date(body.dateSent) : null,
        reportedBy: body.reportedBy || null,
        companyNotificationId: body.companyNotificationId || `NOTIF-${Date.now().toString().slice(-6)}`,
        cqcNotificationNumber: body.cqcNotificationNumber || null,
        details: body.details || null,
        actionsTaken: body.actionsTaken || null,
        outcome: body.outcome || null,
        rcaCompleted: Boolean(body.rcaCompleted),
        safeguardingNotified: Boolean(body.safeguardingNotified),
        investigationCompleted: Boolean(body.investigationCompleted),
        lessonsLearntCompleted: Boolean(body.lessonsLearntCompleted),
        localAuthority: body.localAuthority || null,
        comments: body.comments || null,
        status: body.status || 'OPEN',
        dateClosed: body.dateClosed ? new Date(body.dateClosed) : null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: item, message: 'CQC notification logged successfully' });
  } catch (error) {
    console.error('Error in POST /api/governance/cqc-notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
