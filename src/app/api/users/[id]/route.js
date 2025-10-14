import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/users/[id] - Get a specific user
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    const { id } = params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      username,
      phoneNo,
      role,
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
      niNumber
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email or username is taken by another user
    if (email !== existingUser.email || username !== existingUser.username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { email },
                { username }
              ]
            }
          ]
        }
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'User with this email or username already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      firstName,
      lastName,
      email,
      username,
      phoneNo,
      role,
      status,
      employeeNumber: employeeNumber || null,
      startDate: startDate ? new Date(startDate) : null,
      leaveDate: leaveDate ? new Date(leaveDate) : null,
      regionId: regionId || null,
      emergencyName: emergencyName || null,
      emergencyContact: emergencyContact || null,
      postalCode: postalCode || null,
      contractedHours: contractedHours || null,
      niNumber: niNumber || null
    };

    // Only hash and update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: id },
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
        where: { userId: id }
      });

      // Create new permissions
      await prisma.userPermission.createMany({
        data: permissions.map(permission => ({
          userId: id,
          key: permission
        }))
      });

      // Fetch updated user with permissions
      const updatedUser = await prisma.user.findUnique({
        where: { id: id },
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

    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
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
      where: { userId: id }
    });

    // Delete documents owned by user
    await prisma.document.deleteMany({
      where: { userId: id }
    });

    // Delete standby shifts
    await prisma.standByShift.deleteMany({
      where: { caretakerId: id }
    });

    // Now delete the user
    await prisma.user.delete({
      where: { id }
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
