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
          type: 'shift',
        });
        conflictsByUser.set(assignment.userId, collection);
      }
    });

    // Check for holidays during shift dates
    const holidays = await prisma.holiday.findMany({
      where: {
        userId: { in: staff.map(s => s.id) },
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { startDate: { lte: maxDate } },
              { endDate: { gte: minDate } },
            ],
          },
        ],
      },
      include: {
        holidayType: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Check each occurrence against holidays
    occurrences.forEach((occurrence) => {
      const occurrenceDate = new Date(occurrence);
      occurrenceDate.setHours(0, 0, 0, 0);
      const occurrenceDateOnly = new Date(occurrenceDate);

      holidays.forEach((holiday) => {
        const holidayStart = new Date(holiday.startDate);
        holidayStart.setHours(0, 0, 0, 0);
        const holidayEnd = new Date(holiday.endDate);
        holidayEnd.setHours(23, 59, 59, 999);

        // Check if occurrence date falls within holiday date range (inclusive)
        const isDateInHolidayRange = occurrenceDateOnly >= holidayStart && occurrenceDateOnly <= holidayEnd;
        
        if (!isDateInHolidayRange) {
          return; // Skip this holiday if date doesn't match
        }

        // Check weekend logic: if occurrence is a weekend and holiday doesn't include weekends, skip
        const isWeekend = occurrenceDateOnly.getDay() === 0 || occurrenceDateOnly.getDay() === 6;
        if (isWeekend && !holiday.includeWeekends) {
          return; // Skip weekends if holiday doesn't include them
        }

        // If holiday has specific times, check time overlap
        // If no times specified, the entire day is considered unavailable
        let hasTimeConflict = true;
        if (holiday.startTime && holiday.endTime) {
          try {
            const holidayStartTime = parseTimeToMinutes(holiday.startTime);
            const holidayEndTime = parseTimeToMinutes(holiday.endTime);
            const holidayRange = normaliseTimeRange(holidayStartTime, holidayEndTime);
            if (holidayRange && newShiftRange) {
              hasTimeConflict = doTimeRangesOverlap(newShiftRange, holidayRange);
            }
          } catch (error) {
            // If time parsing fails, assume full day conflict
            console.warn('Error parsing holiday times:', error);
            hasTimeConflict = true;
          }
        }

        // If there's a conflict (date matches and time overlaps if specified), mark as unavailable
        if (hasTimeConflict) {
          const collection = conflictsByUser.get(holiday.userId) || [];
          const holidayTypeName = holiday.holidayType?.name || 'Holiday';
          const dateKey = formatDateKey(occurrence);
          
          // Check if this holiday conflict already exists for this date
          const existingConflict = collection.find(
            c => c.type === 'holiday' && c.date === dateKey && c.holidayId === holiday.id
          );
          
          if (!existingConflict) {
            collection.push({
              type: 'holiday',
              holidayId: holiday.id,
              date: dateKey,
              startTime: holiday.startTime || '00:00',
              endTime: holiday.endTime || '23:59',
              holidayType: holidayTypeName,
              holidayColor: holiday.holidayType?.color || '#3B82F6',
              description: holiday.description || '',
              startDate: formatDateKey(holiday.startDate),
              endDate: formatDateKey(holiday.endDate),
            });
            conflictsByUser.set(holiday.userId, collection);
          }
        }
      });
    });

    const response = staff.map((member) => {
      const conflicts = conflictsByUser.get(member.id) || [];
      // Sort conflicts: holidays first, then by date
      conflicts.sort((a, b) => {
        if (a.type === 'holiday' && b.type !== 'holiday') return -1;
        if (a.type !== 'holiday' && b.type === 'holiday') return 1;
        return a.date.localeCompare(b.date);
      });
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
