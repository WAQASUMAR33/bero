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

export async function GET(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    const task = await prisma.incidentFallTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        incidentType: true,
        location: true,
        witnessedByStaff: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /api/incident-fall-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
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

    const task = await prisma.incidentFallTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: new Date(date),
        time,
        incidentTypeId: parseInt(incidentTypeId),
        incidentLasted,
        locationId: parseInt(locationId),
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

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /api/incident-fall-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    await prisma.incidentFallTask.delete({ where: { id: taskId } });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/incident-fall-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

