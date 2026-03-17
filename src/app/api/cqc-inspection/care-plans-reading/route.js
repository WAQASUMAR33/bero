'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/cqc-inspection/care-plans-reading
// Tracks shift compliance (clock-in rate) per care worker as proxy for care plan access
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

    // Get all shift assignments for the year
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        date: { gte: yearStart, lte: yearEnd },
        status: { in: ['SCHEDULED', 'COMPLETED'] }
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true }
        },
        clockInOuts: {
          select: { id: true, clockInTime: true }
        }
      }
    });

    // Build map: userId -> { name, employeeNumber, months: { Jan: { scheduled, clockedIn } } }
    const staffMap = new Map();

    assignments.forEach(assignment => {
      const u = assignment.user;
      const userId = u.id;
      const monthIndex = new Date(assignment.date).getMonth();
      const monthName = months[monthIndex];
      const hasClockedIn = assignment.clockInOuts && assignment.clockInOuts.length > 0 &&
        assignment.clockInOuts.some(c => c.clockInTime);

      if (!staffMap.has(userId)) {
        staffMap.set(userId, {
          userId,
          name: `${u.firstName} ${u.lastName}`,
          employeeNumber: u.employeeNumber,
          months: {}
        });
      }
      const entry = staffMap.get(userId);
      if (!entry.months[monthName]) {
        entry.months[monthName] = { scheduled: 0, clockedIn: 0 };
      }
      entry.months[monthName].scheduled++;
      if (hasClockedIn) {
        entry.months[monthName].clockedIn++;
      }
    });

    const staff = Array.from(staffMap.values());

    // Calculate totals per staff member
    staff.forEach(s => {
      let totalScheduled = 0, totalClockedIn = 0;
      months.forEach(m => {
        if (s.months[m]) {
          totalScheduled += s.months[m].scheduled;
          totalClockedIn += s.months[m].clockedIn;
        }
      });
      s.totalScheduled = totalScheduled;
      s.totalClockedIn = totalClockedIn;
    });

    // Month totals
    const monthTotals = {};
    months.forEach(m => {
      let scheduled = 0, clockedIn = 0;
      staff.forEach(s => {
        if (s.months[m]) {
          scheduled += s.months[m].scheduled;
          clockedIn += s.months[m].clockedIn;
        }
      });
      monthTotals[m] = { scheduled, clockedIn };
    });

    const grandScheduled = staff.reduce((sum, s) => sum + s.totalScheduled, 0);
    const grandClockedIn = staff.reduce((sum, s) => sum + s.totalClockedIn, 0);

    return NextResponse.json({
      success: true,
      data: {
        staff: staff.sort((a, b) => a.name.localeCompare(b.name)),
        monthTotals,
        grandScheduled,
        grandClockedIn,
        year
      }
    });
  } catch (error) {
    console.error('GET /cqc-inspection/care-plans-reading error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch care plans reading data',
      details: error.message
    }, { status: 500 });
  }
}
