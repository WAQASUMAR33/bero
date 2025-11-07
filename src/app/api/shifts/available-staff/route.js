'use server';

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import {
  generateOccurrences,
  parseTimeToMinutes,
  normaliseTimeRange,
  doTimeRangesOverlap,
} from '@/lib/shiftScheduling';

const formatDateKey = (dateInput) => {
  const date = new Date(dateInput);
  date.setUTCHours(0, 0, 0, 0);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const untilDate = searchParams.get('untilDate');
    const recurrence = searchParams.get('recurrence');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const shiftIdParam = searchParams.get('shiftId');

    if (!fromDate || !recurrence || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'fromDate, recurrence, startTime and endTime are required' },
        { status: 400 }
      );
    }

    const occurrences = generateOccurrences(fromDate, untilDate, recurrence);
    if (occurrences.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const occurrenceKeys = new Set(occurrences.map((occurrence) => formatDateKey(occurrence)));
    const minDate = new Date(Math.min(...occurrences.map((occurrence) => occurrence.getTime())));
    minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(Math.max(...occurrences.map((occurrence) => occurrence.getTime())));
    maxDate.setHours(23, 59, 59, 999);

    const staff = await prisma.user.findMany({
      where: {
        status: 'CURRENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePic: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    const assignmentWhereClause = {
      date: {
        gte: minDate,
        lte: maxDate,
      },
    };

    const shiftId = shiftIdParam ? parseInt(shiftIdParam, 10) : null;
    if (shiftId && Number.isInteger(shiftId)) {
      assignmentWhereClause.shiftId = { not: shiftId };
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where: assignmentWhereClause,
      include: {
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            serviceSeeker: {
              select: { id: true, firstName: true, lastName: true, preferredName: true },
            },
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const relevantAssignments = assignments.filter((assignment) =>
      occurrenceKeys.has(formatDateKey(assignment.date))
    );

    const newShiftRange = normaliseTimeRange(
      parseTimeToMinutes(startTime),
      parseTimeToMinutes(endTime)
    );

    const conflictsByUser = new Map();

    relevantAssignments.forEach((assignment) => {
      const existingRange = normaliseTimeRange(
        parseTimeToMinutes(assignment.shift.startTime),
        parseTimeToMinutes(assignment.shift.endTime)
      );

      if (!existingRange || !newShiftRange) return;

      if (doTimeRangesOverlap(newShiftRange, existingRange)) {
        const collection = conflictsByUser.get(assignment.userId) || [];
        collection.push({
          shiftId: assignment.shift.id,
          date: formatDateKey(assignment.date),
          startTime: assignment.shift.startTime,
          endTime: assignment.shift.endTime,
          serviceSeeker: assignment.shift.serviceSeeker
            ? `${assignment.shift.serviceSeeker.preferredName || assignment.shift.serviceSeeker.firstName} ${assignment.shift.serviceSeeker.lastName}`.trim()
            : null,
        });
        conflictsByUser.set(assignment.userId, collection);
      }
    });

    const response = staff.map((member) => {
      const conflicts = conflictsByUser.get(member.id) || [];
      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        profilePic: member.profilePic,
        role: member.role?.displayName || member.role?.name || null,
        team: member.team?.name || null,
        conflicts,
        isAvailable: conflicts.length === 0,
      };
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('GET /api/shifts/available-staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check availability' }, { status: 500 });
  }
}
