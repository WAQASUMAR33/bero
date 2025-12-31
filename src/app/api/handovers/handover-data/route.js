import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET handover data (visits) for a service seeker on a date
// Note: For remaining tasks, use GET /api/caretaker/tasks?date=YYYY-MM-DD and filter incomplete tasks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const serviceSeekerId = searchParams.get('serviceSeekerId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!serviceSeekerId) {
      return NextResponse.json(
        { success: false, error: 'serviceSeekerId is required' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Fetch visits for the date
    const visits = await prisma.visitTask.findMany({
      where: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: {
          gte: dateObj,
          lt: nextDay
        },
        completed: {
          not: 'YES' // Not completed visits
        }
      },
      select: {
        id: true,
        date: true,
        time: true,
        visitType: true,
        name: true,
        purpose: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        serviceSeekerId: parseInt(serviceSeekerId),
        date: date,
        note: "For remaining tasks, use GET /api/caretaker/tasks?date=YYYY-MM-DD and filter incomplete tasks",
        visits: visits.map(v => ({
          id: v.id,
          date: v.date,
          time: v.time,
          visitType: v.visitType,
          name: v.name,
          purpose: v.purpose
        }))
      }
    });
  } catch (error) {
    console.error('GET /handovers/handover-data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch handover data', details: error.message },
      { status: 500 }
    );
  }
}
