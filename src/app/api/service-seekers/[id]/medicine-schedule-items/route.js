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

    const scheduleItems = await prisma.serviceSeekerMedicineSchedule.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scheduleItems, { status: 200 });
  } catch (e) {
    console.error('GET medicine-schedule-items error:', e);
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

    const normalizedTimes = Array.isArray(b.times)
      ? b.times
          .filter((t) => t.hour && t.minute)
          .map((t) => ({
            hour: String(t.hour).padStart(2, '0'),
            minute: String(t.minute).padStart(2, '0'),
          }))
      : [];

    const normalizedDays = Array.isArray(b.days) ? b.days.filter(Boolean) : [];

    const created = await prisma.serviceSeekerMedicineSchedule.create({
      data: {
        serviceSeekerId,
        medicineName: b.medicineName || '',
        medicineType: b.medicineType || 'CAPSULE',
        prn: b.prn || null,
        // dosage: b.dosage || null, // TODO: Uncomment after regenerating Prisma client
        givenBy: b.givenBy || null,
        directions: b.directions || null,
        applicationGuide: b.applicationGuide || 'NONE',
        showBodyMap: Boolean(b.showBodyMap),
        medicineWarning: b.medicineWarning || null,
        startDate: b.startDate ? new Date(b.startDate) : null,
        endDate: b.endDate ? new Date(b.endDate) : null,
        status: b.status || 'ACTIVE',
        days: normalizedDays,
        times: normalizedTimes,
        frequency: b.frequency || 'Daily',
        team: b.team || 'All',
        requestSignoffBy: b.requestSignoffBy || 'NOT_NEEDED',
        notes: b.notes || null,
      },
    });

    if (b.createTasks && normalizedTimes.length > 0) {
      const today = new Date();

      let daysToCreate = 7;
      const freq = b.frequency || 'Daily';
      if (freq === 'Daily') daysToCreate = 30;
      else if (freq === 'Weekly') daysToCreate = 56;
      else if (freq === 'Fortnightly') daysToCreate = 84;
      else if (freq === 'Every 3 weeks') daysToCreate = 84;
      else if (freq === 'Monthly') daysToCreate = 90;
      else if (freq === 'Quarterly' || freq === 'Yearly') daysToCreate = 365;

      const dayFilters = normalizedDays.map((d) => d.toLowerCase());
      const isDaily = dayFilters.length === 0;

      for (let i = 0; i < daysToCreate; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
        const normalizedDayName = dayName.toLowerCase();

        if (isDaily || dayFilters.includes(normalizedDayName)) {
          for (const timeSlot of normalizedTimes) {
            try {
              await prisma.medicinePrnTask.create({
                data: {
                  serviceSeekerId,
                  applyDate: date,
                  applyTime: `${timeSlot.hour}:${timeSlot.minute}`,
                  prn: b.prn || '',
                  medicineName: b.medicineName || '',
                  medicineType: b.medicineType || 'CAPSULE',
                  administrated: false,
                  notes: b.notes || null,
                  requestSignoffBy: b.requestSignoffBy || 'NOT_NEEDED',
                  signoffByStaffId: null,
                  completed: 'NO',
                  emotion: 'NEUTRAL',
                  createdById: decoded.userId || 1,
                  updatedById: decoded.userId || 1,
                },
              });
            } catch (taskError) {
              if (taskError.code !== 'P2002') {
                console.error('Error creating medicine task:', taskError);
              }
            }
          }
        }
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST medicine-schedule-items error:', e);
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

    const normalizedTimes = Array.isArray(b.times)
      ? b.times
          .filter((t) => t.hour && t.minute)
          .map((t) => ({
            hour: String(t.hour).padStart(2, '0'),
            minute: String(t.minute).padStart(2, '0'),
          }))
      : [];

    const normalizedDays = Array.isArray(b.days) ? b.days.filter(Boolean) : [];

    const updated = await prisma.serviceSeekerMedicineSchedule.update({
      where: { id },
      data: {
        medicineName: b.medicineName || '',
        medicineType: b.medicineType || 'CAPSULE',
        prn: b.prn || null,
        // dosage: b.dosage || null, // TODO: Uncomment after regenerating Prisma client
        givenBy: b.givenBy || null,
        directions: b.directions || null,
        applicationGuide: b.applicationGuide || 'NONE',
        showBodyMap: Boolean(b.showBodyMap),
        medicineWarning: b.medicineWarning || null,
        startDate: b.startDate ? new Date(b.startDate) : null,
        endDate: b.endDate ? new Date(b.endDate) : null,
        status: b.status || 'ACTIVE',
        days: normalizedDays,
        times: normalizedTimes,
        frequency: b.frequency || 'Daily',
        team: b.team || 'All',
        requestSignoffBy: b.requestSignoffBy || 'NOT_NEEDED',
        notes: b.notes || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('PUT medicine-schedule-items error:', e);
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

    await prisma.serviceSeekerMedicineSchedule.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE medicine-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

