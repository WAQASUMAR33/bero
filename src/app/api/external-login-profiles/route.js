import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
export async function GET() {
  try {
    const rows = await prisma.externalLoginProfile.findMany({ orderBy: { firstName: 'asc' } });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET external-login-profiles error:', e);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const b = await request.json();
    
    if (!b.firstName || !b.lastName || !b.email || !b.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(b.password, 10);

    const created = await prisma.externalLoginProfile.create({
      data: {
        firstName: b.firstName,
        lastName: b.lastName,
        type: b.type || 'family',
        email: b.email,
        password: hashedPassword,
        picture: b.picture || null,
      },
    });
    
    // Don't return password in response
    const { password, ...profileWithoutPassword } = created;
    return NextResponse.json(profileWithoutPassword, { status: 201 });
  } catch (e) {
    console.error('POST external-login-profiles error:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}


