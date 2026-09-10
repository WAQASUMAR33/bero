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

    const { searchParams } = new URL(request.url);
    const riskType = searchParams.get('riskType');
    const where = { serviceSeekerId, ...(riskType ? { riskType } : {}) };
    const rows = await prisma.serviceSeekerRiskAssessment.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET risk assessments error:', e);
    return NextResponse.json({ error: 'Failed to fetch risk assessments' }, { status: 500 });
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

    const body = await request.json();
    const created = await prisma.serviceSeekerRiskAssessment.create({
      data: {
        serviceSeekerId,
        riskType: body.riskType,
        lastAssessed: body.lastAssessed ? new Date(body.lastAssessed) : null,
        reviewFrequency: body.reviewFrequency || null,
        whatIsRisk: body.whatIsRisk || null,
        riskBeforeIntervention: body.riskBeforeIntervention || null,
        whoIsAtRisk: body.whoIsAtRisk || null,
        isHistorical: body.isHistorical || null,
        whatCouldHappen: body.whatCouldHappen || null,
        actionToTake: body.actionToTake || null,
        riskAfterControls: body.riskAfterControls || null,
        summary: body.summary || null,
        riskLevel: body.riskLevel || null,
        totalScore: body.totalScore || null,
        staffTeam: body.staffTeam || [],
        conductedBy: body.conductedBy || null,
        office: body.office || null,
        sendSignoffs: body.sendSignoffs === true || body.sendSignoffs === 'true',
        extra: body.extra || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST risk assessments error:', e);
    return NextResponse.json({ error: 'Failed to create risk assessment' }, { status: 500 });
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

    const row = await prisma.serviceSeekerRiskAssessment.findFirst({ where: { id, serviceSeekerId } });
    if (!row) return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });

    await prisma.serviceSeekerRiskAssessment.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE risk assessments error:', e);
    return NextResponse.json({ error: 'Failed to delete risk assessment' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });

    const existing = await prisma.serviceSeekerRiskAssessment.findFirst({ where: { id, serviceSeekerId } });
    if (!existing) return NextResponse.json({ error: 'Risk assessment not found' }, { status: 404 });

    const dataToUpdate = {};
    if (body.riskType !== undefined) dataToUpdate.riskType = body.riskType;
    if (body.lastAssessed !== undefined) dataToUpdate.lastAssessed = body.lastAssessed ? new Date(body.lastAssessed) : null;
    if (body.reviewFrequency !== undefined) dataToUpdate.reviewFrequency = body.reviewFrequency || null;
    if (body.whatIsRisk !== undefined) dataToUpdate.whatIsRisk = body.whatIsRisk || null;
    if (body.riskBeforeIntervention !== undefined) dataToUpdate.riskBeforeIntervention = body.riskBeforeIntervention || null;
    if (body.whoIsAtRisk !== undefined) dataToUpdate.whoIsAtRisk = body.whoIsAtRisk || null;
    if (body.isHistorical !== undefined) dataToUpdate.isHistorical = body.isHistorical || null;
    if (body.whatCouldHappen !== undefined) dataToUpdate.whatCouldHappen = body.whatCouldHappen || null;
    if (body.actionToTake !== undefined) dataToUpdate.actionToTake = body.actionToTake || null;
    if (body.riskAfterControls !== undefined) dataToUpdate.riskAfterControls = body.riskAfterControls || null;
    if (body.summary !== undefined) dataToUpdate.summary = body.summary || null;
    if (body.riskLevel !== undefined) dataToUpdate.riskLevel = body.riskLevel || null;
    if (body.totalScore !== undefined) dataToUpdate.totalScore = body.totalScore || null;
    if (body.staffTeam !== undefined) dataToUpdate.staffTeam = body.staffTeam || [];
    if (body.conductedBy !== undefined) dataToUpdate.conductedBy = body.conductedBy || null;
    if (body.office !== undefined) dataToUpdate.office = body.office || null;
    if (body.sendSignoffs !== undefined) dataToUpdate.sendSignoffs = body.sendSignoffs === true || body.sendSignoffs === 'true';
    if (body.extra !== undefined) dataToUpdate.extra = body.extra || null;

    const updated = await prisma.serviceSeekerRiskAssessment.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT risk assessments error:', e);
    return NextResponse.json({ error: 'Failed to update risk assessment' }, { status: 500 });
  }
}


