'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET all physical intervention tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const tasks = await prisma.physicalInterventionTask.findMany({
      include: {
        serviceSeeker: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /physical-intervention-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch physical intervention tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new physical intervention task
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const task = await prisma.physicalInterventionTask.create({
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
        createdById: decoded.userId,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /physical-intervention-tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to create physical intervention task' },
      { status: 500 }
    );
  }
}

