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

    // Delete related records first to avoid foreign key constraint errors
    // Delete permissions
    await prisma.userPermission.deleteMany({
      where: { userId: userId }
    });

    // Delete documents owned by user
    await prisma.document.deleteMany({
      where: { userId: userId }
    });

    // Delete related Handovers (dependencies of ShiftAssignments and User)
    // 1. Get shift assignments to identify linked handovers
    const userShiftAssignments = await prisma.shiftAssignment.findMany({
      where: { userId: userId },
      select: { id: true }
    });
    const shiftAssignmentIds = userShiftAssignments.map(sa => sa.id);

    // 2. Delete handovers linked to these shifts OR created by the user
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
      // Just delete created handovers if no shifts
      await prisma.handover.deleteMany({
        where: { createdById: userId }
      });
    }

    // Delete Emergency Alerts triggered by user
    await prisma.emergencyAlert.deleteMany({
      where: { triggeredBy: userId }
    });

    // Delete standby shifts
    await prisma.standByShift.deleteMany({
      where: { caretakerId: userId }
    });

    // Delete shift assignments
    await prisma.shiftAssignment.deleteMany({
      where: { userId: userId }
    });

    // Delete clock in/out records
    await prisma.clockInOut.deleteMany({
      where: { userId: userId }
    });

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: userId }
    });

    // Delete push subscriptions
    await prisma.pushSubscription.deleteMany({
      where: { userId: userId }
    });

    // Delete conversation participants
    await prisma.conversationParticipant.deleteMany({
      where: { userId: userId }
    });

    // Delete PP stock transactions
    await prisma.pPStockTransaction.deleteMany({
      where: { userId: userId }
    });

    // Delete policy signatures
    await prisma.policySignature.deleteMany({
      where: { userId: userId }
    });


    // Now delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
