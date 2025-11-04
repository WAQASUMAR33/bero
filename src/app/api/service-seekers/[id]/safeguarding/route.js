'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const rows = await prisma.serviceSeekerSafeguarding.findMany({ where: { serviceSeekerId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET safeguarding error:', e);
    return NextResponse.json({ error: 'Failed to fetch safeguarding incidents' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const b = await request.json();
    const created = await prisma.serviceSeekerSafeguarding.create({
      data: {
        serviceSeekerId,
        investigatorName: b.investigatorName || null,
        serviceUserLocation: b.serviceUserLocation || null,
        incidentDate: b.incidentDate ? new Date(b.incidentDate) : null,
        incidentHour: b.incidentHour ? parseInt(b.incidentHour,10) : null,
        incidentMinute: b.incidentMinute ? parseInt(b.incidentMinute,10) : null,
        preciseLocation: b.preciseLocation || null,
        incidentOverview: b.incidentOverview || null,
        incidentDetails: b.incidentDetails || null,
        witnesses: b.witnesses || null,
        medicalAttentionRequired: b.medicalAttentionRequired || null,
        injuriesDetails: b.injuriesDetails || null,
        decisionReached: b.decisionReached || null,
        immediateAction: b.immediateAction || null,
        lessonsLearned: b.lessonsLearned || null,
        outsideAgenciesContacted: b.outsideAgenciesContacted || null,
        managerRecommendations: b.managerRecommendations || null,
        summary: b.summary || null,
        preventionActions: b.preventionActions || null,
        conductedBy: b.conductedBy || null,
        meetingReportedDate: b.meetingReportedDate ? new Date(b.meetingReportedDate) : null,
        reportedToManagementBy: b.reportedToManagementBy || null,
      }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST safeguarding error:', e);
    return NextResponse.json({ error: 'Failed to create safeguarding incident' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const row = await prisma.serviceSeekerSafeguarding.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerSafeguarding.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE safeguarding error:', e);
    return NextResponse.json({ error: 'Failed to delete safeguarding record' }, { status: 500 });
  }
}


