import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager, canAccessStaffMember, hasPermission } from '@/lib/permissions';

// GET /api/users/[id] - Get a specific user
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Permissions check: Managers can access all, staff can only access their own
    if (!canAccessStaffMember(currentUser, userId)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this staff file. Managers can access all; staff can only access their own.' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        role: true,
        permissions: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        supervisions: {
          orderBy: { supervisionDate: 'desc' },
          include: {
            supervisor: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          }
        },
        appraisals: {
          orderBy: { dueDate: 'desc' },
          include: {
            appraiser: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          }
        },
        probations: {
          orderBy: { dueDate: 'desc' },
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          }
        },
        pdps: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Safe parsing utilities
const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseInteger = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

const parseFloatNumber = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

// PUT /api/users/[id] - Update a specific user
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Session expired. Please log in again.' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const isManagerUser = isManager(currentUser);
    const isSelf = Number(currentUser.id) === Number(userId);

    if (!isManagerUser && !isSelf) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to update other staff members.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      username,
      phoneNo,
      roleId,
      status,
      password,
      permissions = [],
      employeeNumber,
      startDate,
      leaveDate,
      regionId,
      emergencyName,
      emergencyContact,
      postalCode,
      contractedHours,
      niNumber,
      profilePic,
      // Sheet 1: Personal & Contact
      dob,
      secondaryPhone,
      consentToEmail,
      address,
      // Sheet 1: Employment & Compensation
      reasonForLeaving,
      rateOfPay,
      sleepingNights,
      costForSleepingNights,
      salary,
      // Sheet 1: Compliance & Right to Work
      dbsDate,
      dbsUpdateCode,
      sponsorshipStatus,
      shareCode,
      visaExpiryDate,
      cosNumber,
      visaType,
      passportNumber,
      sponsorshipNotes,
      // Sheet 1: Next of Kin & Medical
      nokRelationship,
      allergyStatus,
      allergies,
      vaccinationStatus,
      paysForPrescriptions,
      gpDetails,
      // Sheet 2: Staff Driving Details
      drivingLicenceValid,
      ownCar,
      carMake,
      carModel,
      carColour,
      carRegistration,
      carInsuranceVerified,
      businessInsurance
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email or username is taken by another user (only if they're being changed)
    if (email !== undefined && email !== existingUser.email) {
      const duplicateEmail = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { email }
          ]
        }
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }

    if (username !== undefined && username !== existingUser.username) {
      const duplicateUsername = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { username }
          ]
        }
      });

      if (duplicateUsername) {
        return NextResponse.json(
          { error: 'User with this username already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data - only include fields that are provided (partial update)
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (username !== undefined) updateData.username = username.trim();
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo.trim();
    if (roleId !== undefined) updateData.roleId = parseInteger(roleId);
    if (status !== undefined) updateData.status = (status === 'ARCHIVED' || status === 'CURRENT') ? status : 'CURRENT';
    if (employeeNumber !== undefined) updateData.employeeNumber = (employeeNumber && employeeNumber.trim() !== '') ? employeeNumber.trim() : null;
    if (startDate !== undefined) updateData.startDate = parseDate(startDate);
    if (leaveDate !== undefined) updateData.leaveDate = parseDate(leaveDate);
    if (regionId !== undefined) updateData.regionId = parseInteger(regionId);
    if (emergencyName !== undefined) updateData.emergencyName = emergencyName || null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact || null;
    if (postalCode !== undefined) updateData.postalCode = postalCode || null;
    if (contractedHours !== undefined) updateData.contractedHours = parseInteger(contractedHours);
    if (niNumber !== undefined) updateData.niNumber = niNumber || null;
    if (profilePic !== undefined) updateData.profilePic = profilePic || null;

    // Sheet 1: Personal & Contact
    if (dob !== undefined) updateData.dob = parseDate(dob);
    if (secondaryPhone !== undefined) updateData.secondaryPhone = secondaryPhone || null;
    if (consentToEmail !== undefined) updateData.consentToEmail = Boolean(consentToEmail);
    if (address !== undefined) updateData.address = address || null;

    // Sheet 1: Employment & Compensation
    if (reasonForLeaving !== undefined) updateData.reasonForLeaving = reasonForLeaving || null;
    if (rateOfPay !== undefined) updateData.rateOfPay = parseFloatNumber(rateOfPay);
    if (sleepingNights !== undefined) updateData.sleepingNights = Boolean(sleepingNights);
    if (costForSleepingNights !== undefined) updateData.costForSleepingNights = parseFloatNumber(costForSleepingNights);
    if (salary !== undefined) updateData.salary = parseFloatNumber(salary);

    // Sheet 1: Compliance & Right to Work
    if (dbsDate !== undefined) updateData.dbsDate = parseDate(dbsDate);
    if (dbsUpdateCode !== undefined) updateData.dbsUpdateCode = dbsUpdateCode || null;
    if (sponsorshipStatus !== undefined) updateData.sponsorshipStatus = sponsorshipStatus || null;
    if (shareCode !== undefined) updateData.shareCode = shareCode || null;
    if (visaExpiryDate !== undefined) updateData.visaExpiryDate = parseDate(visaExpiryDate);
    if (cosNumber !== undefined) updateData.cosNumber = cosNumber || null;
    if (visaType !== undefined) updateData.visaType = visaType || null;
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber || null;
    if (sponsorshipNotes !== undefined) updateData.sponsorshipNotes = sponsorshipNotes || null;

    // Sheet 1: Next of Kin & Medical
    if (nokRelationship !== undefined) updateData.nokRelationship = nokRelationship || null;
    if (allergyStatus !== undefined) updateData.allergyStatus = allergyStatus || null;
    if (allergies !== undefined) updateData.allergies = allergies || null;
    if (vaccinationStatus !== undefined) updateData.vaccinationStatus = vaccinationStatus || null;
    if (paysForPrescriptions !== undefined) updateData.paysForPrescriptions = Boolean(paysForPrescriptions);
    if (gpDetails !== undefined) updateData.gpDetails = gpDetails || null;

    // Sheet 2: Staff Driving Details
    if (drivingLicenceValid !== undefined) updateData.drivingLicenceValid = Boolean(drivingLicenceValid);
    if (ownCar !== undefined) updateData.ownCar = Boolean(ownCar);
    if (carMake !== undefined) updateData.carMake = carMake || null;
    if (carModel !== undefined) updateData.carModel = carModel || null;
    if (carColour !== undefined) updateData.carColour = carColour || null;
    if (carRegistration !== undefined) updateData.carRegistration = carRegistration || null;
    if (carInsuranceVerified !== undefined) updateData.carInsuranceVerified = Boolean(carInsuranceVerified);
    if (businessInsurance !== undefined) updateData.businessInsurance = Boolean(businessInsurance);

    // Only hash and update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        region: true,
        permissions: true,
      }
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const uniquePermissions = [...new Set(permissions.filter(p => typeof p === 'string' && p.trim() !== ''))];
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      if (uniquePermissions.length > 0) {
        await prisma.userPermission.createMany({
          data: uniquePermissions.map(permission => ({
            userId,
            key: permission
          })),
          skipDuplicates: true
        });
      }
    }

    // Fetch updated user with region and permissions
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        permissions: true,
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser || user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target || 'a unique field';
      return NextResponse.json(
        { error: `Conflict: ${field} already exists on another user.` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account while logged in.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentAdminId = currentUser.id;

    // 1. Delete permissions
    await prisma.userPermission.deleteMany({
      where: { userId: userId }
    });

    // 2. Delete documents owned by or uploaded by user
    await prisma.document.deleteMany({
      where: {
        OR: [
          { userId: userId },
          { uploadedBy: userId }
        ]
      }
    });

    // 3. Delete related Handovers (dependencies of ShiftAssignments and User)
    const userShiftAssignments = await prisma.shiftAssignment.findMany({
      where: { userId: userId },
      select: { id: true }
    });
    const shiftAssignmentIds = userShiftAssignments.map(sa => sa.id);

    if (shiftAssignmentIds.length > 0) {
      await prisma.handover.deleteMany({
        where: {
          OR: [
            { fromShiftAssignmentId: { in: shiftAssignmentIds } },
            { toShiftAssignmentId: { in: shiftAssignmentIds } },
            { createdById: userId }
          ]
        }
      });
    } else {
      await prisma.handover.deleteMany({
        where: { createdById: userId }
      });
    }

    // 4. Emergency Alerts
    await prisma.emergencyAlert.deleteMany({
      where: { triggeredBy: userId }
    });
    await prisma.emergencyAlert.updateMany({
      where: { acknowledgedBy: userId },
      data: { acknowledgedBy: null }
    });

    // 5. Standby shifts
    await prisma.standByShift.deleteMany({
      where: { caretakerId: userId }
    });

    // 6. Shift assignments
    await prisma.shiftAssignment.deleteMany({
      where: { userId: userId }
    });

    // 7. Clock in/out records
    await prisma.clockInOut.deleteMany({
      where: { userId: userId }
    });

    // 8. Notifications
    await prisma.notification.deleteMany({
      where: { userId: userId }
    });

    // 9. Push subscriptions
    await prisma.pushSubscription.deleteMany({
      where: { userId: userId }
    });

    // 10. Messages & conversations
    await prisma.message.deleteMany({
      where: { senderId: userId }
    });
    await prisma.conversationParticipant.deleteMany({
      where: { userId: userId }
    });

    // 11. Policy signatures and reviews
    await prisma.policySignature.deleteMany({
      where: { userId: userId }
    });
    await prisma.policyReview.deleteMany({
      where: { createdById: userId }
    });
    await prisma.policy.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.policy.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });

    // 12. Holidays
    await prisma.holiday.deleteMany({
      where: { userId: userId }
    });
    await prisma.holiday.updateMany({
      where: { approvedById: userId },
      data: { approvedById: null }
    });
    await prisma.holiday.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.holiday.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });

    // 13. Calendar entries
    await prisma.serviceSeekerCalendarEntry.updateMany({
      where: { careWorkerId: userId },
      data: { careWorkerId: null }
    });
    await prisma.serviceSeekerCalendarEntry.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.serviceSeekerCalendarEntry.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });

    // 14. Shifts and Shift Runs created/updated
    await prisma.shift.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.shift.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });
    await prisma.shiftRun.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.shiftRun.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });

    // 15. Quality Assurance & Maintenance Issues
    await prisma.qualityAssurance.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.qualityAssurance.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });
    await prisma.maintenanceIssue.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.maintenanceIssue.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });

    // 16. Service Seekers created/updated & external inbox access
    await prisma.serviceSeeker.updateMany({
      where: { createdById: userId },
      data: { createdById: currentAdminId }
    });
    await prisma.serviceSeeker.updateMany({
      where: { updatedById: userId },
      data: { updatedById: currentAdminId }
    });
    await prisma.serviceSeekerExternalInboxAccess.deleteMany({
      where: { userId: userId }
    });

    // 17. Clinical tasks signoffs & authorship
    await prisma.incidentFallTask.updateMany({
      where: { witnessedByStaffId: userId },
      data: { witnessedByStaffId: null }
    });
    await prisma.medicinePrnTask.updateMany({
      where: { signoffByStaffId: userId },
      data: { signoffByStaffId: null }
    });

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
        await prisma[model].updateMany({
          where: { createdById: userId },
          data: { createdById: currentAdminId }
        });
        await prisma[model].updateMany({
          where: { updatedById: userId },
          data: { updatedById: currentAdminId }
        });
      }
    }

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
