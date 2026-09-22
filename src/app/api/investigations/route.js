import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const totalCount = await prisma.investigationTracker.count();
    if (totalCount === 0) {
      const now = Date.now();
      await prisma.investigationTracker.createMany({
        data: [
          {
            dateOfIncident: new Date(now - 5 * 24 * 60 * 60 * 1000),
            dateInvestigationCommenced: new Date(now - 4 * 24 * 60 * 60 * 1000),
            personsInvolved: 'Arthur Pendelton (Resident), Nurse Sarah Jenkins',
            areaBeingInvestigated: 'Incident',
            briefOverview: 'Unwitnessed fall in communal dining hall following lunch service. Call bell was not within arm reach.',
            actionsTaken: 'First aid triage performed immediately. Blood pressure and neuro observations logged. Call bell relocated and dining armchairs reconfigured.',
            outcome: 'Resident sustained minor bruising to left forearm; GP conducted assessment and confirmed stable condition. Mobility care plan updated.',
            progress: 'In Progress',
            dateCompleted: null,
            lessonsLearnt: 'Yes',
            comments: 'Follow-up physiotherapist assessment scheduled for Friday. Staff reminder issued in handover regarding mobility aids placement.',
            createdById: currentUser.id,
          },
          {
            dateOfIncident: new Date(now - 12 * 24 * 60 * 60 * 1000),
            dateInvestigationCommenced: new Date(now - 11 * 24 * 60 * 60 * 1000),
            personsInvolved: 'David Thompson (Care Assistant), Mrs. Florence Hughes (Family Member)',
            areaBeingInvestigated: 'Complaint',
            briefOverview: 'Family expressed concern over delayed evening tea service and missing personal cardigan from laundry.',
            actionsTaken: 'Met with Mrs. Hughes to review dietary log and evening staffing allocation. Laundry manager conducted thorough inspection of linen room.',
            outcome: 'Cardigan found with faded nametag in adjacent wing wardrobe, re-labelled and returned with formal apology letter sent.',
            progress: 'Completed',
            dateCompleted: new Date(now - 2 * 24 * 60 * 60 * 1000),
            lessonsLearnt: 'Yes',
            comments: 'Family was satisfied with swift communication and resolution. Enhanced labeling protocol introduced.',
            createdById: currentUser.id,
          },
          {
            dateOfIncident: new Date(now - 2 * 24 * 60 * 60 * 1000),
            dateInvestigationCommenced: new Date(now - 1 * 24 * 60 * 60 * 1000),
            personsInvolved: 'Evelyn Wright (Resident), Night Duty Team',
            areaBeingInvestigated: 'Safeguarding',
            briefOverview: 'Resident observed with unexplained skin tear on lower right leg during morning dressing change.',
            actionsTaken: 'Wound dressing applied per protocol. Local authority safeguarding team notified. Senior carer interviewing night staff regarding transfer assistance.',
            outcome: 'Investigation pending staff statement reviews and bed rail bumper inspection.',
            progress: 'Not Started',
            dateCompleted: null,
            lessonsLearnt: 'N/A',
            comments: 'Safeguarding reference #SG-2026-089 logged. Bed frame inspection scheduled.',
            createdById: currentUser.id,
          }
        ]
      });
    }

    const { searchParams } = new URL(request.url);
    const progress = searchParams.get('progress');
    const area = searchParams.get('area');
    const search = searchParams.get('search')?.trim();

    const where = {};

    if (progress && progress !== 'ALL') {
      where.progress = progress;
    }

    if (area && area !== 'ALL') {
      where.areaBeingInvestigated = area;
    }

    if (search) {
      where.OR = [
        { personsInvolved: { contains: search } },
        { areaBeingInvestigated: { contains: search } },
        { briefOverview: { contains: search } },
        { actionsTaken: { contains: search } },
        { outcome: { contains: search } },
        { comments: { contains: search } }
      ];
    }

    const investigations = await prisma.investigationTracker.findMany({
      where,
      orderBy: [
        { dateOfIncident: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const [total, inProgress, notStarted, completed, areaGroups] = await Promise.all([
      prisma.investigationTracker.count(),
      prisma.investigationTracker.count({ where: { progress: 'In Progress' } }),
      prisma.investigationTracker.count({ where: { progress: 'Not Started' } }),
      prisma.investigationTracker.count({ where: { progress: 'Completed' } }),
      prisma.investigationTracker.groupBy({
        by: ['areaBeingInvestigated'],
        _count: { areaBeingInvestigated: true }
      })
    ]);

    const areas = areaGroups
      .map(g => g.areaBeingInvestigated)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: investigations,
      counts: {
        total,
        inProgress,
        notStarted,
        completed,
      },
      areas,
    });
  } catch (error) {
    console.error('Error in GET /api/investigations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investigations', details: error.message },
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

    if (!body.areaBeingInvestigated?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Area Being Investigated is required' },
        { status: 400 }
      );
    }

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const investigation = await prisma.investigationTracker.create({
      data: {
        dateOfIncident: parseDate(body.dateOfIncident),
        dateInvestigationCommenced: parseDate(body.dateInvestigationCommenced),
        personsInvolved: body.personsInvolved?.trim() || null,
        areaBeingInvestigated: body.areaBeingInvestigated.trim(),
        briefOverview: body.briefOverview?.trim() || null,
        actionsTaken: body.actionsTaken?.trim() || null,
        outcome: body.outcome?.trim() || null,
        progress: body.progress?.trim() || 'Not Started',
        dateCompleted: parseDate(body.dateCompleted),
        lessonsLearnt: body.lessonsLearnt?.trim() || 'N/A',
        comments: body.comments?.trim() || null,
        createdById: currentUser.id,
      }
    });

    return NextResponse.json({ success: true, data: investigation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/investigations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create investigation', details: error.message },
      { status: 500 }
    );
  }
}
