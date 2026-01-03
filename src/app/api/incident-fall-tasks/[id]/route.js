import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET);

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
    console.error('GET /api/incident-fall-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
    const existingTask = await prisma.incidentFallTask.findUnique({
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
      if (body.incidentLasted !== undefined) updateData.incidentLasted = body.incidentLasted;
      if (body.othersInvolved !== undefined) updateData.othersInvolved = body.othersInvolved;
      if (body.othersInvolvedDetails !== undefined) updateData.othersInvolvedDetails = body.othersInvolvedDetails || null;
      if (body.injuryDetail !== undefined) updateData.injuryDetail = body.injuryDetail || null;
      if (body.serviceUserInjured !== undefined) updateData.serviceUserInjured = body.serviceUserInjured;
      if (body.witnessedBy !== undefined) updateData.witnessedBy = body.witnessedBy;
      if (body.witnessedByStaffId !== undefined) updateData.witnessedByStaffId = body.witnessedByStaffId ? parseInt(body.witnessedByStaffId) : null;
      if (body.witnessDetail !== undefined) updateData.witnessDetail = body.witnessDetail || null;
      if (body.photoConsent !== undefined) updateData.photoConsent = body.photoConsent;
      if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl || null;
      if (body.residentInfoProvided !== undefined) updateData.residentInfoProvided = body.residentInfoProvided;
      if (body.whatResidentDoing !== undefined) updateData.whatResidentDoing = body.whatResidentDoing || null;
      if (body.howIncidentHappened !== undefined) updateData.howIncidentHappened = body.howIncidentHappened || null;
      if (body.dateReportedToSeniorStaff !== undefined) updateData.dateReportedToSeniorStaff = body.dateReportedToSeniorStaff ? new Date(body.dateReportedToSeniorStaff) : null;
      if (body.equipmentInvolved !== undefined) updateData.equipmentInvolved = body.equipmentInvolved;
      if (body.relativesInformed !== undefined) updateData.relativesInformed = body.relativesInformed;
      if (body.contactsCalled !== undefined) updateData.contactsCalled = body.contactsCalled;
      if (body.notes !== undefined) updateData.notes = body.notes || null;
      if (body.emotion !== undefined) updateData.emotion = body.emotion;
      if (body.signatureUrl !== undefined) updateData.signatureUrl = body.signatureUrl || null;
      // Explicitly prevent updating serviceSeekerId, date, time, incidentTypeId, locationId
    } else {
      // Admins/managers can update all fields
      updateData = {
        serviceSeekerId: body.serviceSeekerId ? parseInt(body.serviceSeekerId) : undefined,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time,
        incidentTypeId: body.incidentTypeId ? parseInt(body.incidentTypeId) : undefined,
        incidentLasted: body.incidentLasted,
        locationId: body.locationId ? parseInt(body.locationId) : undefined,
        othersInvolved: body.othersInvolved,
        othersInvolvedDetails: body.othersInvolvedDetails !== undefined ? (body.othersInvolvedDetails || null) : undefined,
        injuryDetail: body.injuryDetail !== undefined ? (body.injuryDetail || null) : undefined,
        serviceUserInjured: body.serviceUserInjured,
        witnessedBy: body.witnessedBy,
        witnessedByStaffId: body.witnessedByStaffId !== undefined ? (body.witnessedByStaffId ? parseInt(body.witnessedByStaffId) : null) : undefined,
        witnessDetail: body.witnessDetail !== undefined ? (body.witnessDetail || null) : undefined,
        photoConsent: body.photoConsent,
        photoUrl: body.photoUrl !== undefined ? (body.photoUrl || null) : undefined,
        residentInfoProvided: body.residentInfoProvided,
        whatResidentDoing: body.whatResidentDoing !== undefined ? (body.whatResidentDoing || null) : undefined,
        howIncidentHappened: body.howIncidentHappened !== undefined ? (body.howIncidentHappened || null) : undefined,
        dateReportedToSeniorStaff: body.dateReportedToSeniorStaff !== undefined ? (body.dateReportedToSeniorStaff ? new Date(body.dateReportedToSeniorStaff) : null) : undefined,
        equipmentInvolved: body.equipmentInvolved,
        relativesInformed: body.relativesInformed,
        contactsCalled: body.contactsCalled,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
        emotion: body.emotion,
        signatureUrl: body.signatureUrl !== undefined ? (body.signatureUrl || null) : undefined,
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    }

    updateData.updatedById = decoded.userId;

    const task = await prisma.incidentFallTask.update({
      where: { id: taskId },
      data: updateData,
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    
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
    await prisma.incidentFallTask.delete({ where: { id: taskId } });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/incident-fall-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

