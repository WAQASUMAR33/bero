import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/users - Fetch all users
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // In a real app, you'd verify the JWT token here
    // For now, we'll just check if it exists
    
    const users = await prisma.user.findMany({
      include: {
        region: true,
        role: true,
        permissions: true,
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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
      niNumber
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password || !phoneNo) {
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

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}