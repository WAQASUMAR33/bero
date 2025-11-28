'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const parseDate = (value) => (value ? new Date(value) : null);

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const plans = await prisma.serviceSeekerMedicinePrnPlan.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('GET medicine-prn-plans error:', error);
    return NextResponse.json({ error: 'Failed to fetch PRN plans' }, { status: 500 });
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

    const created = await prisma.serviceSeekerMedicinePrnPlan.create({
      data: {
        serviceSeekerId,
        medicineName: body.medicineName || '',
        medicineType: body.medicineType || 'Tablet / Pill',
        team: body.team || 'All',
        directions: body.directions || null,
        applicationGuide: body.applicationGuide || 'NONE',
        showBodyMap: Boolean(body.showBodyMap),
        medicineWarning: body.medicineWarning || null,
        startDate: parseDate(body.startDate),
        endDate: parseDate(body.endDate),
        givenBy: body.givenBy || null,
        howToTake: body.howToTake || null,
        communication: body.communication || null,
        medicineDetails: body.medicineDetails || null,
        maxDose24h: body.maxDose24h || null,
        reasonForMedication: body.reasonForMedication || null,
        expectedOutcome: body.expectedOutcome || null,
        expectedOutcomeTimeframe: body.expectedOutcomeTimeframe || null,
        actionIfNoOutcome: body.actionIfNoOutcome || null,
        whenToReferGp: body.whenToReferGp || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST medicine-prn-plans error:', error);
    return NextResponse.json({ error: 'Failed to save PRN plan' }, { status: 500 });
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
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const updated = await prisma.serviceSeekerMedicinePrnPlan.update({
      where: { id, serviceSeekerId },
      data: {
        medicineName: body.medicineName || '',
        medicineType: body.medicineType || 'Tablet / Pill',
        team: body.team || 'All',
        directions: body.directions || null,
        applicationGuide: body.applicationGuide || 'NONE',
        showBodyMap: Boolean(body.showBodyMap),
        medicineWarning: body.medicineWarning || null,
        startDate: parseDate(body.startDate),
        endDate: parseDate(body.endDate),
        givenBy: body.givenBy || null,
        howToTake: body.howToTake || null,
        communication: body.communication || null,
        medicineDetails: body.medicineDetails || null,
        maxDose24h: body.maxDose24h || null,
        reasonForMedication: body.reasonForMedication || null,
        expectedOutcome: body.expectedOutcome || null,
        expectedOutcomeTimeframe: body.expectedOutcomeTimeframe || null,
        actionIfNoOutcome: body.actionIfNoOutcome || null,
        whenToReferGp: body.whenToReferGp || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT medicine-prn-plans error:', error);
    return NextResponse.json({ error: 'Failed to update PRN plan' }, { status: 500 });
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

    await prisma.serviceSeekerMedicinePrnPlan.delete({
      where: { id, serviceSeekerId },
    });

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('DELETE medicine-prn-plans error:', error);
    return NextResponse.json({ error: 'Failed to delete PRN plan' }, { status: 500 });
  }
}

