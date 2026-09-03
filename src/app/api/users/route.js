import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/users - Fetch all users
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const includeArchived = searchParams.get('includeArchived');

    const where = {};
    if ((statusParam && statusParam.toLowerCase() === 'all') || includeArchived === 'true') {
      // Return all users
    } else if (statusParam && statusParam.toUpperCase() === 'ARCHIVED') {
      where.status = 'ARCHIVED';
    } else {
      // Default: only CURRENT users across the system (shifts, rota, calendar, etc.)
      where.status = 'CURRENT';
    }

    const users = await prisma.user.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Remove password from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      username,
      phoneNo,
      roleId: roleIdStr,
      status,
      password,
      permissions = [],
      employeeNumber,
      startDate,
      leaveDate,
      regionId: regionIdStr,
      emergencyName,
      emergencyContact,
      postalCode,
      contractedHours,
      niNumber,
      profilePic
    } = body;

    // Convert string IDs to integers
    const roleId = roleIdStr ? parseInt(roleIdStr) : null;
    const regionId = regionIdStr ? parseInt(regionIdStr) : null;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password || !phoneNo || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        phoneNo,
        roleId,
        status,
        password: hashedPassword,
        isEmailVerified: true,
        profilePic: profilePic || null,
        employeeNumber: employeeNumber || null,
        startDate: startDate ? new Date(startDate) : null,
        leaveDate: leaveDate ? new Date(leaveDate) : null,
        regionId: regionId || null,
        emergencyName: emergencyName || null,
        emergencyContact: emergencyContact || null,
        postalCode: postalCode || null,
        contractedHours: contractedHours || null,
        niNumber: niNumber || null,
        permissions: {
          create: permissions.map(permission => ({
            key: permission
          }))
        }
      },
      include: {
        region: true,
        permissions: true,
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Notify HR and Admins about new staff member (OPTIMIZED)
    try {
      const hrAdmins = await prisma.user.findMany({
        where: {
          role: { name: { in: ['ADMIN', 'HR', 'DIRECTOR'] } },
          status: 'CURRENT'
        },
        select: { id: true },
        take: 50 // Limit to prevent excessive queries
      });

      if (hrAdmins.length > 0) {
        await prisma.notification.createMany({
          data: hrAdmins.map(admin => ({
            userId: admin.id,
            title: 'New Staff Member Registered',
            message: `${firstName} ${lastName} has been added to the system.`,
            type: 'INFO',
            link: '/admin/staff-management',
            isRead: false
          })),
          skipDuplicates: true
        });
      }
    } catch (notifError) {
      console.error('Failed to create new staff notifications:', notifError);
    }

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}