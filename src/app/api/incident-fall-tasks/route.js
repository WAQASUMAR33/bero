import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserIdFromToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.incidentFallTask.findMany({
      include: {
        serviceSeeker: true,
        incidentType: true,
        location: true,
        witnessedByStaff: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/incident-fall-tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      serviceSeekerId,
      date,
      time,
      incidentTypeId,
      incidentLasted,
      locationId,
      othersInvolved,
      othersInvolvedDetails,
      injuryDetail,
      serviceUserInjured,
      witnessedBy,
      witnessedByStaffId,
      witnessDetail,
      photoConsent,
      photoUrl,
      residentInfoProvided,
      whatResidentDoing,
      howIncidentHappened,
      dateReportedToSeniorStaff,
      equipmentInvolved,
      relativesInformed,
      contactsCalled,
      notes,
      emotion,
      signatureUrl
    } = body;

    const task = await prisma.incidentFallTask.create({
      data: {
        serviceSeekerId,
        date: new Date(date),
        time,
        incidentTypeId,
        incidentLasted,
        locationId,
        othersInvolved,
        othersInvolvedDetails: othersInvolvedDetails || null,
        injuryDetail: injuryDetail || null,
        serviceUserInjured,
        witnessedBy,
        witnessedByStaffId: witnessedByStaffId || null,
        witnessDetail: witnessDetail || null,
        photoConsent,
        photoUrl: photoUrl || null,
        residentInfoProvided,
        whatResidentDoing: whatResidentDoing || null,
        howIncidentHappened: howIncidentHappened || null,
        dateReportedToSeniorStaff: dateReportedToSeniorStaff ? new Date(dateReportedToSeniorStaff) : null,
        equipmentInvolved,
        relativesInformed,
        contactsCalled,
        notes: notes || null,
        emotion,
        signatureUrl: signatureUrl || null,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        serviceSeeker: true,
        incidentType: true,
        location: true,
        witnessedByStaff: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/incident-fall-tasks error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

