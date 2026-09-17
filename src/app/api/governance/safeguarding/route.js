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
    const count = await prisma.safeguardingTracker.count();
    if (count === 0) {
      await prisma.safeguardingTracker.createMany({
        data: [
          {
            incidentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            serviceUser: 'Arthur Pendelton',
            location: 'Oakwood Lodge',
            dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            localAuthority: 'Hertfordshire County Council',
            reportedBy: 'Sarah Jenkins (Care Worker)',
            details: 'Bruising observed on service user left forearm during assisted personal care. Service user unable to recall origin due to cognitive impairment.',
            actionsTaken: 'Body map completed, GP review booked, family informed. Staff shift handover notes reviewed.',
            outcome: 'GP determined soft tissue contusion consistent with gentle bump against bed rail. Padded bed rail protectors installed.',
            rcaCompleted: true,
            investigationCompleted: true,
            lessonsLearntCompleted: true,
            comments: 'Local authority safeguarding team notified; concluded as no evidence of abuse or neglect.',
            status: 'CLOSED',
            dateClosed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            createdById: currentUser.id,
          },
          {
            incidentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            serviceUser: 'Thomas Higgins',
            location: 'Rose Cottage',
            dateReported: new Date(),
            localAuthority: 'Essex County Council',
            reportedBy: 'Emma Watson (Senior Care Assistant)',
            details: 'Financial concern: discrepancy noted between service user personal allowance receipts and cash tin balance during weekly audit.',
            actionsTaken: 'Cash tin locked and quarantined. Finance manager notified. Safeguarding alert raised with Adult Social Care financial abuse team.',
            outcome: 'Formal audit underway with all care staff who held keys during the past 14 days.',
            rcaCompleted: false,
            investigationCompleted: false,
            lessonsLearntCompleted: false,
            comments: 'Police notified and incident reference obtained.',
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
        { serviceUser: { contains: search } },
        { location: { contains: search } },
        { localAuthority: { contains: search } },
        { reportedBy: { contains: search } },
        { details: { contains: search } },
        { actionsTaken: { contains: search } },
      ];
    }

    const [items, totalCount, openCount, investigatingCount, closedCount, locations] = await Promise.all([
      prisma.safeguardingTracker.findMany({
        where,
        orderBy: { incidentDate: 'desc' },
      }),
      prisma.safeguardingTracker.count(),
      prisma.safeguardingTracker.count({ where: { status: 'OPEN' } }),
      prisma.safeguardingTracker.count({ where: { status: 'INVESTIGATING' } }),
      prisma.safeguardingTracker.count({ where: { status: 'CLOSED' } }),
      prisma.safeguardingTracker.findMany({
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
          investigating: investigatingCount,
          closed: closedCount,
        },
        locations: locations.map(l => l.location).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/governance/safeguarding:', error);
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
    if (!body.serviceUser) {
      return NextResponse.json({ success: false, error: 'Service User Name is required' }, { status: 400 });
    }

    const item = await prisma.safeguardingTracker.create({
      data: {
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
        serviceUser: body.serviceUser,
        location: body.location || null,
        dateReported: body.dateReported ? new Date(body.dateReported) : new Date(),
        localAuthority: body.localAuthority || null,
        reportedBy: body.reportedBy || null,
        details: body.details || null,
        actionsTaken: body.actionsTaken || null,
        outcome: body.outcome || null,
        rcaCompleted: Boolean(body.rcaCompleted),
        investigationCompleted: Boolean(body.investigationCompleted),
        lessonsLearntCompleted: Boolean(body.lessonsLearntCompleted),
        comments: body.comments || null,
        status: body.status || 'OPEN',
        dateClosed: body.dateClosed ? new Date(body.dateClosed) : null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: item, message: 'Safeguarding incident logged successfully' });
  } catch (error) {
    console.error('Error in POST /api/governance/safeguarding:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
