'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/cqc-inspection/air-filter
// Tracks housekeeping task completion for air filter / clothes dryer checks
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get all housekeeping tasks for the year
    const tasks = await prisma.houseKeepingTask.findMany({
      where: {
        date: { gte: yearStart, lte: yearEnd }
      },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        }
      }
    });

    // Build map: serviceSeekerId -> { name, months: { Jan: { completed, total } } }
    const serviceUsersMap = new Map();

    tasks.forEach(task => {
      const su = task.serviceSeeker;
      const suId = su.id;
      const suName = su.preferredName || `${su.firstName} ${su.lastName}`;
      const monthIndex = new Date(task.date).getMonth();
      const monthName = months[monthIndex];

      if (!serviceUsersMap.has(suId)) {
        serviceUsersMap.set(suId, { id: suId, name: suName, months: {} });
      }
      const entry = serviceUsersMap.get(suId);
      if (!entry.months[monthName]) {
        entry.months[monthName] = { completed: 0, total: 0 };
      }
      entry.months[monthName].total++;
      if (task.completed === 'YES') {
        entry.months[monthName].completed++;
      }
    });

    const serviceUsers = Array.from(serviceUsersMap.values());

    // Calculate totals per service user
    serviceUsers.forEach(su => {
      let totalCompleted = 0, totalTasks = 0;
      months.forEach(m => {
        if (su.months[m]) {
          totalCompleted += su.months[m].completed;
          totalTasks += su.months[m].total;
        }
      });
      su.totalCompleted = totalCompleted;
      su.totalTasks = totalTasks;
    });

    // Month totals
    const monthTotals = {};
    months.forEach(m => {
      let completed = 0, total = 0;
      serviceUsers.forEach(su => {
        if (su.months[m]) {
          completed += su.months[m].completed;
          total += su.months[m].total;
        }
      });
      monthTotals[m] = { completed, total };
    });

    const grandTotal = serviceUsers.reduce((sum, su) => sum + su.totalTasks, 0);
    const grandCompleted = serviceUsers.reduce((sum, su) => sum + su.totalCompleted, 0);

    return NextResponse.json({
      success: true,
      data: {
        serviceUsers: serviceUsers.sort((a, b) => a.name.localeCompare(b.name)),
        monthTotals,
        grandTotal,
        grandCompleted,
        year
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/air-filter error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch air filter data',
      details: error.message
    }, { status: 500 });
  }
}
