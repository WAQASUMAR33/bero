'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    if (!prisma.serviceSeekerOtherAddress) {
      console.warn('Prisma client missing model ServiceSeekerOtherAddress. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const otherAddresses = await prisma.serviceSeekerOtherAddress.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(otherAddresses || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/other-addresses error:', error);
    return NextResponse.json({ error: 'Failed to fetch other addresses' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { addressType, addressLine1, addressLine2, addressLine3, addressLine4, addressLine5, postcode } = body;

    if (!addressType) {
      return NextResponse.json({ error: 'Address type is required' }, { status: 400 });
    }

    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerOtherAddress) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.serviceSeekerOtherAddress.create({
      data: {
        serviceSeekerId,
        addressType: addressType.trim(),
        addressLine1: addressLine1?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        addressLine3: addressLine3?.trim() || null,
        addressLine4: addressLine4?.trim() || null,
        addressLine5: addressLine5?.trim() || null,
        postcode: postcode?.trim() || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/other-addresses error:', error);
    return NextResponse.json({ error: 'Failed to create other address' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { id, addressType, addressLine1, addressLine2, addressLine3, addressLine4, addressLine5, postcode } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!addressType) {
      return NextResponse.json({ error: 'Address type is required' }, { status: 400 });
    }

    if (!prisma.serviceSeekerOtherAddress) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.serviceSeekerOtherAddress.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Other address not found' }, { status: 404 });
    }

    const updated = await prisma.serviceSeekerOtherAddress.update({
      where: { id: parseInt(id, 10) },
      data: {
        addressType: addressType.trim(),
        addressLine1: addressLine1?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        addressLine3: addressLine3?.trim() || null,
        addressLine4: addressLine4?.trim() || null,
        addressLine5: addressLine5?.trim() || null,
        postcode: postcode?.trim() || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/other-addresses error:', error);
    return NextResponse.json({ error: 'Failed to update other address' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const addressId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(addressId)) return NextResponse.json({ error: 'Invalid other address ID' }, { status: 400 });

    if (!prisma.serviceSeekerOtherAddress) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const address = await prisma.serviceSeekerOtherAddress.findFirst({
      where: { id: addressId, serviceSeekerId },
    });

    if (!address) {
      return NextResponse.json({ error: 'Other address not found' }, { status: 404 });
    }

    await prisma.serviceSeekerOtherAddress.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: 'Other address deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/other-addresses error:', error);
    return NextResponse.json({ error: 'Failed to delete other address' }, { status: 500 });
  }
}

