import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// GET /api/users/[id] - Get a specific user
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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

    // Delete standby shifts
    await prisma.standByShift.deleteMany({
      where: { caretakerId: userId }
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
