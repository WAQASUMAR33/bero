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

    const scheduleItems = await prisma.serviceSeekerWeightSchedule.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scheduleItems);
  } catch (e) {
    console.error('GET weight-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
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

    const b = await request.json();

    if (!b.frequency || !Array.isArray(b.times) || b.times.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: times and frequency are required' 
      }, { status: 400 });
    }

    // Create schedule item (not tasks - tasks will be generated on-demand)
    const created = await prisma.serviceSeekerWeightSchedule.create({
      data: {
        serviceSeekerId,
        times: b.times,
        frequency: b.frequency,
        team: b.team || 'All',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST weight-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to create items' }, { status: 500 });
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

    const b = await request.json();
    const id = parseInt(b.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const updated = await prisma.serviceSeekerWeightSchedule.update({
      where: { id },
      data: {
        times: b.times,
        frequency: b.frequency,
        team: b.team || 'All',
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT weight-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
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
    const id = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    await prisma.serviceSeekerWeightSchedule.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE weight-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

