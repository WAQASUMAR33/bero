import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          region: true,
          role: true,
          permissions: true,
        },
      });
    } catch (dbErr) {
      const message = (dbErr && (dbErr.message || '')).toString();

      // MySQL connection / resource limits
      // Example error:
      // ERROR 42000 (1226): User 'xxx' has exceeded the 'max_connections_per_hour' resource
      if (message.includes('max_connections_per_hour') || message.includes('ERROR 42000 (1226)')) {
        return NextResponse.json(
          {
            error: 'Database connection limit reached. Please try again in a few minutes.',
            details: 'The database user has exceeded the allowed number of connections per hour.',
          },
          { status: 503 }
        );
      }

      // Generic database-unavailable handling
      if (message.includes("Can't reach database server") || dbErr.code === 'P1001') {
        return NextResponse.json(
          { error: 'Database unavailable. Please try again shortly.' },
          { status: 503 }
        );
      }

      throw dbErr;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'CURRENT') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoggedIn: new Date() },
    });

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions.map(p => p.key),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
