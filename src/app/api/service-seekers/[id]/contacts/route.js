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

    if (!prisma.serviceSeekerContact) {
      return NextResponse.json([], { status: 200 });
    }

    const contacts = await prisma.serviceSeekerContact.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
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
    const created = await prisma.serviceSeekerContact.create({
      data: {
        serviceSeekerId,
        contactType: body.contactType,
        name: body.name?.trim() || 'Unknown',
        role: body.role?.trim() || null,
        otherRole: body.otherRole?.trim() || null,
        mobile: body.mobile?.trim() || null,
        work: body.work?.trim() || null,
        home: body.home?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        practiceCode: body.practiceCode?.trim() || null,
        emergencyContact: body.emergencyContact === true || body.emergencyContact === 'true',
        pictureUrl: body.pictureUrl || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
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
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });

    const existing = await prisma.serviceSeekerContact.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });
    if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    const updated = await prisma.serviceSeekerContact.update({
      where: { id: parseInt(id, 10) },
      data: {
        contactType: body.contactType,
        name: body.name?.trim() || 'Unknown',
        role: body.role?.trim() || null,
        otherRole: body.otherRole?.trim() || null,
        mobile: body.mobile?.trim() || null,
        work: body.work?.trim() || null,
        home: body.home?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        practiceCode: body.practiceCode?.trim() || null,
        emergencyContact: body.emergencyContact === true || body.emergencyContact === 'true',
        pictureUrl: body.pictureUrl || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
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
    const contactId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(contactId)) return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });

    const contact = await prisma.serviceSeekerContact.findFirst({
      where: { id: contactId, serviceSeekerId },
    });
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    await prisma.serviceSeekerContact.delete({ where: { id: contactId } });
    return NextResponse.json({ message: 'Contact deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}


