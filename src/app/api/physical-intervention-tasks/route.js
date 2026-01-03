'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET all physical intervention tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user role to check if care worker
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    const isCareWorker = userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER';

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const dateParam = searchParams.get('date');
    
    const where = {};
    
    // For care workers, filter by shift assignments
    if (isCareWorker) {
      const date = dateParam ? new Date(dateParam) : new Date();
      date.setHours(0, 0, 0, 0);
      
      // Get shift assignments for this user on this date
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          userId: decoded.userId,
          date: date,
          status: 'SCHEDULED'
        },
        include: {
          shift: {
            select: {
              serviceSeekerId: true
            }
          }
        }
      });

      // Extract unique service seeker IDs from assignments
      const assignedServiceSeekerIds = [...new Set(assignments.map(a => a.shift.serviceSeekerId))];
      
      if (assignedServiceSeekerIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      
      where.serviceSeekerId = { in: assignedServiceSeekerIds };
    } else if (serviceSeekerId) {
      // For non-care workers, allow filtering by serviceSeekerId if provided
      where.serviceSeekerId = parseInt(serviceSeekerId);
    }
    
    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: date,
        lt: nextDay
      };
    }

    const tasks = await prisma.physicalInterventionTask.findMany({
      where,
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
    
    // Check if user is care worker or support worker - they cannot create tasks
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoleName = currentUser.role?.name;
    if (userRoleName === 'CAREWORKER' || userRoleName === 'SUPPORT_WORKER') {
      return NextResponse.json({ 
        error: 'Care workers and support workers cannot create tasks. Tasks are created automatically from schedules.' 
      }, { status: 403 });
    }
    
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

