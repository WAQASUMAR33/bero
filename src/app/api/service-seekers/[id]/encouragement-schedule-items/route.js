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

    // For now, return empty array since we don't have a schedule model
    // This can be enhanced later with a proper schedule system
    return NextResponse.json([]);
  } catch (e) {
    console.error('GET encouragement-schedule-items error:', e);
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

    // Create corresponding encouragement tasks if needed
    if (b.createTasks && Array.isArray(b.times) && b.times.length > 0 && b.encouragement && b.frequency) {
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

      // Get unique days from time slots
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
                await prisma.encouragementTask.create({
                  data: {
                    serviceSeekerId,
                    date: date,
                    time: `${timeSlot.hour || '00'}:${timeSlot.minute || '00'}`,
                    encouragement: b.encouragement,
                    note: null,
                    completed: 'NO',
                    emotion: 'NEUTRAL',
                    createdById: decoded.userId || 1,
                    updatedById: decoded.userId || 1,
                  },
                });
              } catch (taskError) {
                // Skip if task already exists (duplicate date/time)
                if (taskError.code !== 'P2002') {
                  console.error('Error creating encouragement task:', taskError);
                }
              }
            }
          }
        }
      }
    }

    // Return a success response
    return NextResponse.json({ success: true, message: 'Tasks created successfully' }, { status: 201 });
  } catch (e) {
    console.error('POST encouragement-schedule-items error:', e);
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

    // For now, return error since we don't have a schedule model
    return NextResponse.json({ error: 'Update not yet supported' }, { status: 501 });
  } catch (e) {
    console.error('PUT encouragement-schedule-items error:', e);
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

    // For now, return error since we don't have a schedule model
    return NextResponse.json({ error: 'Delete not yet supported' }, { status: 501 });
  } catch (e) {
    console.error('DELETE encouragement-schedule-items error:', e);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}


