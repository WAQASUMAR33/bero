'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single physical intervention task
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    const task = await prisma.physicalInterventionTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Physical intervention task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /physical-intervention-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch physical intervention task' },
      { status: 500 }
    );
  }
}

// PUT - Update physical intervention task
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();

    const task = await prisma.physicalInterventionTask.update({
      where: { id: taskId },
      data: {
        serviceSeekerId: body.serviceSeekerId,
        date: new Date(body.date),
        time: body.time,
        location: body.location,
        wereOtherStaffInvolved: body.wereOtherStaffInvolved,
        otherStaffNames: body.otherStaffNames || null,
        wereOtherResidenceInvolved: body.wereOtherResidenceInvolved,
        otherResidenceNamesExplanation: body.otherResidenceNamesExplanation || null,
        wereAnyInjuriesSustained: body.wereAnyInjuriesSustained,
        injuriesExplanation: body.injuriesExplanation || null,
        didResidenceStaffRequireMedication: body.didResidenceStaffRequireMedication,
        medicationExplanation: body.medicationExplanation || null,
        hasAccidentBeenFilled: body.hasAccidentBeenFilled,
        accidentFilledExplanation: body.accidentFilledExplanation || null,
        accidentBookDateTime: body.accidentBookDateTime || null,
        accidentBookNumber: body.accidentBookNumber || null,
        detailOfPhysicalIntervention: body.detailOfPhysicalIntervention,
        techniquesUsed: body.techniquesUsed,
        positionOfStaffMembers: body.positionOfStaffMembers,
        durationOfPhysicalIntervention: body.durationOfPhysicalIntervention,
        wereRestraintsUsed: body.wereRestraintsUsed,
        durationOfWholeIncident: body.durationOfWholeIncident,
        wasReportedToManager: body.wasReportedToManager,
        reportedToManagerExplanation: body.reportedToManagerExplanation || null,
        managerReportTime: body.managerReportTime || null,
        emotion: body.emotion,
        cqcNotified: body.cqcNotified,
        safeguardingNotified: body.safeguardingNotified,
        familyMemberNotified: body.familyMemberNotified,
        externalProfessional: body.externalProfessional,
        signatureUrl: body.signatureUrl || null,
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /physical-intervention-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update physical intervention task' },
      { status: 500 }
    );
  }
}

// DELETE physical intervention task
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.physicalInterventionTask.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Physical intervention task deleted successfully' });
  } catch (error) {
    console.error('DELETE /physical-intervention-tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete physical intervention task' },
      { status: 500 }
    );
  }
}

