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

    // Seed sample records if empty
    const count = await prisma.riddorTracker.count();
    if (count === 0) {
      await prisma.riddorTracker.createMany({
        data: [
          {
            incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            affectedPersonType: 'Staff',
            affectedPersonName: 'Michael Brown (Support Worker)',
            location: 'Maple House',
            dateReported: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            reportedBy: 'Jane Miller (Registered Manager)',
            hseReferenceNumber: 'HSE-F2508-98124',
            details: 'Staff member sustained an ankle fracture following a trip on external patio paving during rainy conditions while escorting service user.',
            actionsTaken: 'First aid rendered on site, ambulance called, transported to A&E. Patio area cordoned off with high-vis warning tape.',
            outcome: 'Paving slabs relaid and leveled by maintenance contractor. HSE form F2508 submitted online within 10 days.',
            rcaCompleted: true,
            cqcNotified: true,
            safeguardingNotified: false,
            ipcNotified: false,
            investigationCompleted: true,
            lessonsLearntCompleted: true,
            comments: 'HSE acknowledged notification. Return-to-work phased plan agreed with occupational health.',
            status: 'CLOSED',
            dateClosed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            createdById: currentUser.id,
          },
          {
            incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            affectedPersonType: 'Service User',
            affectedPersonName: 'Evelyn Wright',
            location: 'Oakwood Lodge',
            dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            reportedBy: 'David Miller (Senior Team Leader)',
            hseReferenceNumber: 'HSE-PENDING',
            details: 'Fall resulting in wrist fracture requiring hospital admission and surgical fixation.',
            actionsTaken: 'Transferred via emergency services. Environmental safety check completed. Hoist and sling inspected and certified in working order.',
            outcome: 'Post-fall protocol initiated. Moving and handling risk assessment under revision.',
            rcaCompleted: false,
            cqcNotified: true,
            safeguardingNotified: true,
            ipcNotified: false,
            investigationCompleted: false,
            lessonsLearntCompleted: false,
            comments: 'HSE statutory online report submitted.',
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
        { affectedPersonName: { contains: search } },
        { location: { contains: search } },
        { hseReferenceNumber: { contains: search } },
        { details: { contains: search } },
        { reportedBy: { contains: search } },
        { affectedPersonType: { contains: search } },
      ];
    }

    const [items, totalCount, openCount, reportedCount, closedCount, locations] = await Promise.all([
      prisma.riddorTracker.findMany({
        where,
        orderBy: { incidentDate: 'desc' },
      }),
      prisma.riddorTracker.count(),
      prisma.riddorTracker.count({ where: { status: 'OPEN' } }),
      prisma.riddorTracker.count({ where: { status: 'REPORTED_TO_HSE' } }),
      prisma.riddorTracker.count({ where: { status: 'CLOSED' } }),
      prisma.riddorTracker.findMany({
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
          reportedToHse: reportedCount,
          closed: closedCount,
        },
        locations: locations.map(l => l.location).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/governance/riddor:', error);
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
    if (!body.affectedPersonName) {
      return NextResponse.json({ success: false, error: 'Affected Person Name is required' }, { status: 400 });
    }

    const item = await prisma.riddorTracker.create({
      data: {
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
        affectedPersonType: body.affectedPersonType || 'Staff',
        affectedPersonName: body.affectedPersonName,
        location: body.location || null,
        dateReported: body.dateReported ? new Date(body.dateReported) : new Date(),
        reportedBy: body.reportedBy || null,
        hseReferenceNumber: body.hseReferenceNumber || null,
        details: body.details || null,
        actionsTaken: body.actionsTaken || null,
        outcome: body.outcome || null,
        rcaCompleted: Boolean(body.rcaCompleted),
        cqcNotified: Boolean(body.cqcNotified),
        safeguardingNotified: Boolean(body.safeguardingNotified),
        ipcNotified: Boolean(body.ipcNotified),
        investigationCompleted: Boolean(body.investigationCompleted),
        lessonsLearntCompleted: Boolean(body.lessonsLearntCompleted),
        comments: body.comments || null,
        status: body.status || 'OPEN',
        dateClosed: body.dateClosed ? new Date(body.dateClosed) : null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: item, message: 'RIDDOR incident logged successfully' });
  } catch (error) {
    console.error('Error in POST /api/governance/riddor:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
