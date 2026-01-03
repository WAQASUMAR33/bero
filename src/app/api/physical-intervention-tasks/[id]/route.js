'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET single physical intervention task
export async function GET(request, { params }) {
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

    // For care workers, verify they have a shift assignment for this service user
    if (isCareWorker) {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: taskDate,
          status: 'SCHEDULED',
          shift: {
            serviceSeekerId: task.serviceSeekerId
          }
        }
      });
      
      if (!assignment) {
        return NextResponse.json({ 
          error: 'You do not have permission to view this task. You are not assigned to this service user.' 
        }, { status: 403 });
      }
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

    const { id } = await params;
    const taskId = parseInt(id);
    
    // Get existing task to verify permissions
    const existingTask = await prisma.physicalInterventionTask.findUnique({
      where: { id: taskId },
      include: {
        serviceSeeker: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // For care workers, verify they have a shift assignment for this service user
    if (isCareWorker) {
      const taskDate = new Date(existingTask.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const assignment = await prisma.shiftAssignment.findFirst({
        where: {
          userId: decoded.userId,
          date: taskDate,
          status: 'SCHEDULED',
          shift: {
            serviceSeekerId: existingTask.serviceSeekerId
          }
        }
      });
      
      if (!assignment) {
        return NextResponse.json({ 
          error: 'You do not have permission to update this task. You are not assigned to this service user.' 
        }, { status: 403 });
      }
    }

    const body = await request.json();

    // For care workers, only allow updating specific fields (not serviceSeekerId, date, time)
    let updateData = {};
    
    if (isCareWorker) {
      // Care workers can only update: task data, notes, emotion
      if (body.location !== undefined) updateData.location = body.location;
      if (body.wereOtherStaffInvolved !== undefined) updateData.wereOtherStaffInvolved = body.wereOtherStaffInvolved;
      if (body.otherStaffNames !== undefined) updateData.otherStaffNames = body.otherStaffNames || null;
      if (body.wereOtherResidenceInvolved !== undefined) updateData.wereOtherResidenceInvolved = body.wereOtherResidenceInvolved;
      if (body.otherResidenceNamesExplanation !== undefined) updateData.otherResidenceNamesExplanation = body.otherResidenceNamesExplanation || null;
      if (body.wereAnyInjuriesSustained !== undefined) updateData.wereAnyInjuriesSustained = body.wereAnyInjuriesSustained;
      if (body.injuriesExplanation !== undefined) updateData.injuriesExplanation = body.injuriesExplanation || null;
      if (body.didResidenceStaffRequireMedication !== undefined) updateData.didResidenceStaffRequireMedication = body.didResidenceStaffRequireMedication;
      if (body.medicationExplanation !== undefined) updateData.medicationExplanation = body.medicationExplanation || null;
      if (body.hasAccidentBeenFilled !== undefined) updateData.hasAccidentBeenFilled = body.hasAccidentBeenFilled;
      if (body.accidentFilledExplanation !== undefined) updateData.accidentFilledExplanation = body.accidentFilledExplanation || null;
      if (body.accidentBookDateTime !== undefined) updateData.accidentBookDateTime = body.accidentBookDateTime || null;
      if (body.accidentBookNumber !== undefined) updateData.accidentBookNumber = body.accidentBookNumber || null;
      if (body.detailOfPhysicalIntervention !== undefined) updateData.detailOfPhysicalIntervention = body.detailOfPhysicalIntervention;
      if (body.techniquesUsed !== undefined) updateData.techniquesUsed = body.techniquesUsed;
      if (body.positionOfStaffMembers !== undefined) updateData.positionOfStaffMembers = body.positionOfStaffMembers;
      if (body.durationOfPhysicalIntervention !== undefined) updateData.durationOfPhysicalIntervention = body.durationOfPhysicalIntervention;
      if (body.wereRestraintsUsed !== undefined) updateData.wereRestraintsUsed = body.wereRestraintsUsed;
      if (body.durationOfWholeIncident !== undefined) updateData.durationOfWholeIncident = body.durationOfWholeIncident;
      if (body.wasReportedToManager !== undefined) updateData.wasReportedToManager = body.wasReportedToManager;
      if (body.reportedToManagerExplanation !== undefined) updateData.reportedToManagerExplanation = body.reportedToManagerExplanation || null;
      if (body.managerReportTime !== undefined) updateData.managerReportTime = body.managerReportTime || null;
      if (body.emotion !== undefined) updateData.emotion = body.emotion;
      if (body.cqcNotified !== undefined) updateData.cqcNotified = body.cqcNotified;
      if (body.safeguardingNotified !== undefined) updateData.safeguardingNotified = body.safeguardingNotified;
      if (body.familyMemberNotified !== undefined) updateData.familyMemberNotified = body.familyMemberNotified;
      if (body.externalProfessional !== undefined) updateData.externalProfessional = body.externalProfessional;
      if (body.signatureUrl !== undefined) updateData.signatureUrl = body.signatureUrl || null;
      // Explicitly prevent updating serviceSeekerId, date, time
    } else {
      // Admins/managers can update all fields
      updateData = {
        serviceSeekerId: body.serviceSeekerId,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time,
        location: body.location,
        wereOtherStaffInvolved: body.wereOtherStaffInvolved,
        otherStaffNames: body.otherStaffNames !== undefined ? (body.otherStaffNames || null) : undefined,
        wereOtherResidenceInvolved: body.wereOtherResidenceInvolved,
        otherResidenceNamesExplanation: body.otherResidenceNamesExplanation !== undefined ? (body.otherResidenceNamesExplanation || null) : undefined,
        wereAnyInjuriesSustained: body.wereAnyInjuriesSustained,
        injuriesExplanation: body.injuriesExplanation !== undefined ? (body.injuriesExplanation || null) : undefined,
        didResidenceStaffRequireMedication: body.didResidenceStaffRequireMedication,
        medicationExplanation: body.medicationExplanation !== undefined ? (body.medicationExplanation || null) : undefined,
        hasAccidentBeenFilled: body.hasAccidentBeenFilled,
        accidentFilledExplanation: body.accidentFilledExplanation !== undefined ? (body.accidentFilledExplanation || null) : undefined,
        accidentBookDateTime: body.accidentBookDateTime !== undefined ? (body.accidentBookDateTime || null) : undefined,
        accidentBookNumber: body.accidentBookNumber !== undefined ? (body.accidentBookNumber || null) : undefined,
        detailOfPhysicalIntervention: body.detailOfPhysicalIntervention,
        techniquesUsed: body.techniquesUsed,
        positionOfStaffMembers: body.positionOfStaffMembers,
        durationOfPhysicalIntervention: body.durationOfPhysicalIntervention,
        wereRestraintsUsed: body.wereRestraintsUsed,
        durationOfWholeIncident: body.durationOfWholeIncident,
        wasReportedToManager: body.wasReportedToManager,
        reportedToManagerExplanation: body.reportedToManagerExplanation !== undefined ? (body.reportedToManagerExplanation || null) : undefined,
        managerReportTime: body.managerReportTime !== undefined ? (body.managerReportTime || null) : undefined,
        emotion: body.emotion,
        cqcNotified: body.cqcNotified,
        safeguardingNotified: body.safeguardingNotified,
        familyMemberNotified: body.familyMemberNotified,
        externalProfessional: body.externalProfessional,
        signatureUrl: body.signatureUrl !== undefined ? (body.signatureUrl || null) : undefined,
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    }

    updateData.updatedById = decoded.userId;

    const task = await prisma.physicalInterventionTask.update({
      where: { id: taskId },
      data: updateData,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is care worker or support worker - they cannot delete tasks
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
        error: 'Care workers and support workers cannot delete tasks.' 
      }, { status: 403 });
    }

    const { id } = await params;
    const taskId = parseInt(id);

    await prisma.physicalInterventionTask.delete({
      where: { id: taskId }
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

