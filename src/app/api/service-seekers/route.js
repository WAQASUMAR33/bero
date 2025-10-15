'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/service-seekers
export async function GET() {
  try {
    const seekers = await prisma.serviceSeeker.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(seekers, { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers error:', error);
    return NextResponse.json({ error: 'Failed to fetch service users' }, { status: 500 });
  }
}

// POST /api/service-seekers
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      postalCode,
      address,
      latitude,
      longitude,
      photoUrl,
      title,
      preferredName,
      dateOfBirth,
      gender,
      genderAtBirth,
      pronouns,
      dnar,
      sexuality,
      status,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 });
    }

    const created = await prisma.serviceSeeker.create({
      data: {
        firstName,
        lastName,
        postalCode: postalCode || null,
        address: address || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        photoUrl: photoUrl || null,
        title: title || null,
        preferredName: preferredName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        genderAtBirth: genderAtBirth || null,
        pronouns: pronouns || null,
        dnar: typeof dnar === 'boolean' ? dnar : null,
        sexuality: sexuality || null,
        status: status || 'LIVE',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers error:', error);
    return NextResponse.json({ error: 'Failed to create service user' }, { status: 500 });
  }
}


