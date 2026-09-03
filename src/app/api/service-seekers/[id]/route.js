'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// GET /api/service-seekers/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);
    const seeker = await prisma.serviceSeeker.findUnique({
      where: { id: seekerId },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });
    if (!seeker) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(seeker, { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch service user' }, { status: 500 });
  }
}

// PUT /api/service-seekers/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);
    const body = await request.json();

    // Define allowed fields for ServiceSeeker model
    const allowedFields = [
      'firstName', 'lastName', 'postalCode', 'address', 'latitude', 'longitude',
      'photoUrl', 'photoDate', 'title', 'preferredName', 'dateOfBirth', 'gender', 'genderAtBirth',
      'pronouns', 'dnar', 'sexuality', 'status'
    ];

    // Filter out invalid fields (like genderOther, genderAtBirthOther, sexualityOther, etc.)
    const filteredData = {};
    allowedFields.forEach(field => {
      if (body.hasOwnProperty(field)) {
        filteredData[field] = body[field];
      }
    });

    // Handle date conversions
    if (filteredData.dateOfBirth) {
      filteredData.dateOfBirth = new Date(filteredData.dateOfBirth);
    } else if (filteredData.dateOfBirth === null || filteredData.dateOfBirth === '') {
      filteredData.dateOfBirth = null;
    }

    if (filteredData.photoDate) {
      filteredData.photoDate = new Date(filteredData.photoDate);
    } else if (filteredData.photoDate === null || filteredData.photoDate === '') {
      filteredData.photoDate = null;
    }

    // Handle numeric conversions
    if (filteredData.latitude !== undefined) {
      filteredData.latitude = filteredData.latitude === '' || filteredData.latitude === null ? null : parseFloat(filteredData.latitude);
    }
    if (filteredData.longitude !== undefined) {
      filteredData.longitude = filteredData.longitude === '' || filteredData.longitude === null ? null : parseFloat(filteredData.longitude);
    }

    // Always set updatedById
    filteredData.updatedById = decoded.userId;

    const updated = await prisma.serviceSeeker.update({
      where: { id: seekerId },
      data: filteredData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update service user' }, { status: 500 });
  }
}

// DELETE /api/service-seekers/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = await params;
    const seekerId = parseInt(id);

    // 1. Delete handovers and shifts
    await prisma.handover.deleteMany({ where: { serviceSeekerId: seekerId } });
    
    const shifts = await prisma.shift.findMany({
      where: { serviceSeekerId: seekerId },
      select: { id: true }
    });
    const shiftIds = shifts.map(s => s.id);
    if (shiftIds.length > 0) {
      await prisma.shiftAssignment.deleteMany({
        where: { shiftId: { in: shiftIds } }
      });
      await prisma.shift.deleteMany({ where: { serviceSeekerId: seekerId } });
    }

    // 2. Delete clock in/outs
    await prisma.clockInOut.deleteMany({ where: { serviceSeekerId: seekerId } });

    // 3. Delete care tasks
    const taskModels = [
      'bathingTask', 'behaviourTask', 'bloodTestTask', 'bloodPressureTask',
      'comfortCheckTask', 'communicationNotesTask', 'familyPhotoMessageTask',
      'foodDrinkTask', 'generalSupportTask', 'houseKeepingTask', 'incidentFallTask',
      'medicinePrnTask', 'muacTask', 'observationTask', 'oneToOneTask',
      'oralCareTask', 'oxygenTask', 'personCentredTask', 'physicalInterventionTask',
      'pulseTask', 'repositionTask', 'spendingMoneyTask', 'stoolTask',
      'temperatureTask', 'visitTask', 'weightTask', 'encouragementTask', 'followUpTask'
    ];

    for (const model of taskModels) {
      if (prisma[model]) {
        await prisma[model].deleteMany({ where: { serviceSeekerId: seekerId } });
      }
    }

    // 4. Calendar and resident meetings
    await prisma.serviceSeekerResidentMeeting.deleteMany({ where: { serviceSeekerId: seekerId } });
    await prisma.serviceSeekerCalendarEntry.deleteMany({ where: { serviceSeekerId: seekerId } });

    // 5. Assessments, Safeguarding, Feedback & Forms
    const assessmentModels = [
      'serviceSeekerOutcome', 'serviceSeekerRiskAssessment', 'serviceSeekerSafeguarding',
      'serviceSeekerFeedback', 'serviceSeekerMarReview', 'serviceSeekerAlertThreshold',
      'serviceSeekerMustAssessment', 'serviceSeekerWaterlowAssessment',
      'serviceSeekerPersonalProperty', 'serviceSeekerMentalCapacity', 'serviceSeekerMcaAssessment'
    ];
    for (const model of assessmentModels) {
      if (prisma[model]) {
        await prisma[model].deleteMany({ where: { serviceSeekerId: seekerId } });
      }
    }

    // 6. Admission, Contacts, Docs & Notes
    const profileModels = [
      'serviceSeekerAdmission', 'serviceSeekerContact', 'serviceSeekerDocument',
      'serviceSeekerConfidentialNote', 'serviceSeekerFunding', 'serviceSeekerOtherId',
      'serviceSeekerOtherTelephone', 'serviceSeekerOtherAddress', 'serviceSeekerHealthTag'
    ];
    for (const model of profileModels) {
      if (prisma[model]) {
        await prisma[model].deleteMany({ where: { serviceSeekerId: seekerId } });
      }
    }

    // 7. External Access
    await prisma.serviceSeekerExternalLogin.deleteMany({ where: { serviceSeekerId: seekerId } });
    await prisma.serviceSeekerExternalInboxAccess.deleteMany({ where: { serviceSeekerId: seekerId } });

    // 8. Allowance
    await prisma.serviceSeekerAllowanceTransaction.deleteMany({ where: { serviceSeekerId: seekerId } });
    await prisma.serviceSeekerAllowanceSettings.deleteMany({ where: { serviceSeekerId: seekerId } });

    // 9. Schedules
    const bathingSchedules = await prisma.serviceSeekerBathingSchedule.findMany({
      where: { serviceSeekerId: seekerId },
      select: { id: true }
    });
    const bathingScheduleIds = bathingSchedules.map(b => b.id);
    if (bathingScheduleIds.length > 0) {
      await prisma.serviceSeekerBathingScheduleItem.deleteMany({
        where: { scheduleId: { in: bathingScheduleIds } }
      });
      await prisma.serviceSeekerBathingSchedule.deleteMany({
        where: { serviceSeekerId: seekerId }
      });
    }

    const scheduleModels = [
      'serviceSeekerFoodDrinksSchedule', 'serviceSeekerFoodDrinksSettings',
      'serviceSeekerHouseKeepingSchedule', 'serviceSeekerSocialVisitInstructions',
      'serviceSeekerMedicineAccessCodes', 'serviceSeekerPositioningHandling',
      'serviceSeekerBathingDefaultTime', 'serviceSeekerMedicineSchedule',
      'serviceSeekerMedicinePrnPlan', 'serviceSeekerOralCareSchedule',
      'serviceSeekerOralCareDefaultTime', 'serviceSeekerEncouragementSchedule',
      'serviceSeekerStoolSchedule', 'serviceSeekerWeightSchedule',
      'serviceSeekerMuacSchedule', 'serviceSeekerPersonCentredSchedule'
    ];
    for (const model of scheduleModels) {
      if (prisma[model]) {
        await prisma[model].deleteMany({ where: { serviceSeekerId: seekerId } });
      }
    }

    await prisma.serviceSeeker.delete({ where: { id: seekerId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete service user' }, { status: 500 });
  }
}


