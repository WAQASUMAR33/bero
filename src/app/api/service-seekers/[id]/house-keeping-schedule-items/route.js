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

    const scheduleItems = await prisma.serviceSeekerHouseKeepingSchedule.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scheduleItems, { status: 200 });
  } catch (e) {
    console.error('GET house-keeping-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const b = await request.json();

    const created = await prisma.serviceSeekerHouseKeepingSchedule.create({
      data: {
        serviceSeekerId,
        task: b.task || '',
        temperatureCheck: b.temperatureCheck || null,
        times: b.times || [],
        frequency: b.frequency || 'Daily',
        team: b.team || 'All',
      },
    });

    // Create corresponding house keeping tasks if needed
    if (b.createTasks && Array.isArray(b.times) && b.times.length > 0) {
      const today = new Date();
      
      // Determine how many days/weeks to create tasks for based on frequency
      let daysToCreate = 7; // Default: 1 week
      if (b.frequency === 'Daily') {
        daysToCreate = 30; // 1 month for daily
      } else if (b.frequency === 'Weekly') {
        daysToCreate = 56; // 8 weeks for weekly
      } else if (b.frequency === 'Fortnightly') {
        daysToCreate = 84; // 12 weeks for fortnightly
      } else if (b.frequency === 'Every 3 weeks') {
        daysToCreate = 84; // 12 weeks
      } else if (b.frequency === 'Monthly') {
        daysToCreate = 90; // 3 months
      } else if (b.frequency === 'Quarterly') {
        daysToCreate = 365; // 1 year
      } else if (b.frequency === 'Yearly') {
        daysToCreate = 365; // 1 year
      }

      // For house keeping, times are typically just hour:minute without day specification
      // But we can still check if there's a day field
      const selectedDays = b.times.map(t => t.day).filter(Boolean);
      const isDaily = b.frequency === 'Daily' || selectedDays.length === 0;

      for (let i = 0; i < daysToCreate; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });

        // Check if this day should have tasks
        if (isDaily || selectedDays.includes(dayName)) {
          for (const timeSlot of b.times) {
            // For daily, use all times. For specific days, match the day
            if (isDaily || timeSlot.day === dayName || !timeSlot.day) {
              try {
                await prisma.houseKeepingTask.create({
                  data: {
                    serviceSeekerId,
                    date: date,
                    time: `${timeSlot.hour || '00'}:${timeSlot.minute || '00'}`,
                    task: b.task || '',
                    notes: null,
                    photoUrl: null,
                    completed: 'NO',
                    emotion: 'NEUTRAL',
                    createdById: decoded.userId || 1,
                    updatedById: decoded.userId || 1,
                  },
                });
              } catch (taskError) {
                // Skip if task already exists (duplicate date/time)
                if (taskError.code !== 'P2002') {
                  console.error('Error creating house keeping task:', taskError);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST house-keeping-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to create item', details: e.message }, { status: 500 });
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

    const updated = await prisma.serviceSeekerHouseKeepingSchedule.update({
      where: { id },
      data: {
        task: b.task || '',
        temperatureCheck: b.temperatureCheck || null,
        times: b.times || [],
        frequency: b.frequency || 'Daily',
        team: b.team || 'All',
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT house-keeping-schedule-items error:', e);
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

    await prisma.serviceSeekerHouseKeepingSchedule.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE house-keeping-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

