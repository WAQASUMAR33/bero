import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/users/[id] - Get a specific user
export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        permissions: true,
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

// PUT /api/users/[id] - Update a specific user
export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
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
      profilePic
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

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (status !== undefined) updateData.status = status;
    if (employeeNumber !== undefined) updateData.employeeNumber = employeeNumber || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (leaveDate !== undefined) updateData.leaveDate = leaveDate ? new Date(leaveDate) : null;
    if (regionId !== undefined) updateData.regionId = regionId || null;
    if (emergencyName !== undefined) updateData.emergencyName = emergencyName || null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact || null;
    if (postalCode !== undefined) updateData.postalCode = postalCode || null;
    if (contractedHours !== undefined) updateData.contractedHours = contractedHours || null;
    if (niNumber !== undefined) updateData.niNumber = niNumber || null;
    if (profilePic !== undefined) updateData.profilePic = profilePic || null;

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
    if (permissions.length >= 0) {
      // Delete existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      // Create new permissions
      await prisma.userPermission.createMany({
        data: permissions.map(permission => ({
          userId,
          key: permission
        }))
      });

      // Fetch updated user with permissions
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          region: true,
          permissions: true,
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      return NextResponse.json(userWithoutPassword);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
