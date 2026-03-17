'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/cqc-inspection/medicine-refusal
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

    // Get all medicine PRN tasks for the year
    const medicineTasks = await prisma.medicinePrnTask.findMany({
      where: {
        applyDate: { gte: yearStart, lte: yearEnd }
      },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        }
      }
    });

    // Build map: serviceSeekerId -> { name, months: { Jan: { refused, administered, attempted, total } } }
    const serviceUsersMap = new Map();

    medicineTasks.forEach(task => {
      const su = task.serviceSeeker;
      const suId = su.id;
      const suName = su.preferredName || `${su.firstName} ${su.lastName}`;
      const monthIndex = new Date(task.applyDate).getMonth();
      const monthName = months[monthIndex];

      if (!serviceUsersMap.has(suId)) {
        serviceUsersMap.set(suId, { id: suId, name: suName, months: {} });
      }
      const entry = serviceUsersMap.get(suId);
      if (!entry.months[monthName]) {
        entry.months[monthName] = { refused: 0, administered: 0, attempted: 0, total: 0 };
      }
      entry.months[monthName].total++;
      if (task.completed === 'NO') entry.months[monthName].refused++;
      else if (task.completed === 'YES') entry.months[monthName].administered++;
      else if (task.completed === 'ATTEMPTED') entry.months[monthName].attempted++;
    });

    const serviceUsers = Array.from(serviceUsersMap.values());

    // Calculate totals per service user
    serviceUsers.forEach(su => {
      let totalRefused = 0, totalAdministered = 0, totalTasks = 0;
      months.forEach(m => {
        if (su.months[m]) {
          totalRefused += su.months[m].refused;
          totalAdministered += su.months[m].administered;
          totalTasks += su.months[m].total;
        }
      });
      su.totalRefused = totalRefused;
      su.totalAdministered = totalAdministered;
      su.totalTasks = totalTasks;
    });

    // Month totals
    const monthTotals = {};
    months.forEach(m => {
      let refused = 0, administered = 0, total = 0;
      serviceUsers.forEach(su => {
        if (su.months[m]) {
          refused += su.months[m].refused;
          administered += su.months[m].administered;
          total += su.months[m].total;
        }
      });
      monthTotals[m] = { refused, administered, total };
    });

    const grandTotal = serviceUsers.reduce((sum, su) => sum + su.totalTasks, 0);
    const grandRefused = serviceUsers.reduce((sum, su) => sum + su.totalRefused, 0);

    return NextResponse.json({
      success: true,
      data: {
        serviceUsers: serviceUsers.sort((a, b) => (b.totalRefused - a.totalRefused)),
        monthTotals,
        grandTotal,
        grandRefused,
        year
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/medicine-refusal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch medicine refusal data',
      details: error.message
    }, { status: 500 });
  }
}
