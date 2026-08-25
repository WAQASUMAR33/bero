'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildShiftAssignmentData, getRecurrenceIncrementDays } from '@/lib/shiftScheduling';
import jwt from 'jsonwebtoken';

// GET /api/shifts/[id]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const shiftId = parseInt(id);
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true, photoUrl: true }
        },
        shiftType: true,
        funder: true,
        shiftRun: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error('GET /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

// PUT /api/shifts/[id]
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const shiftId = parseInt(id);
    const body = await request.json();
    const {
      serviceSeekerId,
      fromDate,
      untilDate,
      recurrence,
      startTime,
      endTime,
      shiftTypeId,
      totalStaffRequired,
      funderId,
      timeCritical,
      shiftRunId,
      notesForCarers,
      notesForManager
    } = body;

    const parsedTotalStaff = totalStaffRequired !== undefined ? parseInt(totalStaffRequired, 10) : undefined;
    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...(serviceSeekerId && { serviceSeekerId: parseInt(serviceSeekerId) }),
        ...(fromDate && { fromDate: new Date(fromDate) }),
        ...(untilDate !== undefined && { untilDate: untilDate ? new Date(untilDate) : null }),
        ...(recurrence && { recurrence }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(shiftTypeId && { shiftTypeId: parseInt(shiftTypeId) }),
        ...(parsedTotalStaff !== undefined && !Number.isNaN(parsedTotalStaff) && { totalStaffRequired: parsedTotalStaff }),
        ...(funderId !== undefined && { funderId: funderId ? parseInt(funderId) : null }),
        ...(timeCritical !== undefined && { timeCritical }),
        ...(shiftRunId !== undefined && { shiftRunId: shiftRunId ? parseInt(shiftRunId) : null }),
        ...(notesForCarers !== undefined && { notesForCarers }),
        ...(notesForManager !== undefined && { notesForManager }),
        updatedById: decoded.userId
      },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        },
        shiftType: true,
        funder: {
          select: { id: true, fundingSource: true, contractNumber: true }
        },
        shiftRun: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      }
    });

    if (body.assignedUserIds !== undefined) {
      const uniqueAssignedUserIds = Array.isArray(body.assignedUserIds)
        ? [...new Set(body.assignedUserIds.map((value) => parseInt(value, 10)).filter((value) => Number.isInteger(value)))]
        : [];

      await prisma.shiftAssignment.deleteMany({ where: { shiftId } });

      if (uniqueAssignedUserIds.length > 0) {
        const assignmentData = buildShiftAssignmentData({
          shiftId,
          userIds: uniqueAssignedUserIds,
          fromDate: shift.fromDate,
          untilDate: shift.untilDate,
          recurrence: shift.recurrence,
        });

        if (assignmentData.length > 0) {
          await prisma.shiftAssignment.createMany({ data: assignmentData, skipDuplicates: true });
        }
      }
    }

    const shiftWithAssignments = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        serviceSeeker: {
          select: { id: true, firstName: true, lastName: true, preferredName: true }
        },
        shiftType: true,
        funder: {
          select: { id: true, fundingSource: true, contractNumber: true }
        },
        shiftRun: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePic: true }
            }
          }
        }
      }
    });

    return NextResponse.json(shiftWithAssignments ?? shift);
  } catch (error) {
    console.error('PUT /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

// DELETE /api/shifts/[id]
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const shiftId = parseInt(id);

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all'; // 'occurrence' | 'following' | 'all'
    const targetDateStr = searchParams.get('date'); // 'YYYY-MM-DD'

    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
      }
    });

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Helper: clean up references before deleting assignments
    const safeDeleteAssignments = async (whereCondition) => {
      const assignmentsToDelete = await prisma.shiftAssignment.findMany({
        where: whereCondition,
        select: { id: true }
      });
      const assignmentIds = assignmentsToDelete.map(a => a.id);

      if (assignmentIds.length > 0) {
        // Disconnect from ClockInOut if any
        await prisma.clockInOut.updateMany({
          where: { shiftAssignmentId: { in: assignmentIds } },
          data: { shiftAssignmentId: null }
        });

        // Delete shift assignments
        await prisma.shiftAssignment.deleteMany({
          where: { id: { in: assignmentIds } }
        });
      }
    };

    if (scope === 'all' || !targetDateStr) {
      // 1. Delete all assignments (safe delete unlinking clock-ins)
      await safeDeleteAssignments({ shiftId });
      // 2. Delete the shift
      await prisma.shift.delete({
        where: { id: shiftId }
      });
      return NextResponse.json({ message: 'All occurrences deleted successfully' });
    }

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const fromDate = new Date(existingShift.fromDate);
    fromDate.setHours(0, 0, 0, 0);

    const untilDate = existingShift.untilDate ? new Date(existingShift.untilDate) : null;
    if (untilDate) untilDate.setHours(0, 0, 0, 0);

    const incrementDays = getRecurrenceIncrementDays(existingShift.recurrence);

    if (scope === 'following') {
      // If targetDate is on or before fromDate, deleting all following deletes the entire shift
      if (targetDate <= fromDate) {
        await safeDeleteAssignments({ shiftId });
        await prisma.shift.delete({
          where: { id: shiftId }
        });
        return NextResponse.json({ message: 'Shift and all future occurrences deleted successfully' });
      }

      // Cut off recurrence: set untilDate to the day before targetDate
      const dayBefore = new Date(targetDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      dayBefore.setHours(23, 59, 59, 999);

      await prisma.shift.update({
        where: { id: shiftId },
        data: { untilDate: dayBefore }
      });

      // Delete future assignments from targetDate onward
      await safeDeleteAssignments({
        shiftId,
        date: { gte: targetDate }
      });

      return NextResponse.json({ message: 'This and all following shifts deleted successfully' });
    }

    if (scope === 'occurrence') {
      // If non-recurring (incrementDays === 0), delete the shift
      if (!incrementDays) {
        await safeDeleteAssignments({ shiftId });
        await prisma.shift.delete({ where: { id: shiftId } });
        return NextResponse.json({ message: 'Shift occurrence deleted successfully' });
      }

      // Delete assignment on that specific date
      const startOfTargetDate = new Date(targetDate);
      startOfTargetDate.setHours(0, 0, 0, 0);
      const endOfTargetDate = new Date(targetDate);
      endOfTargetDate.setHours(23, 59, 59, 999);

      await safeDeleteAssignments({
        shiftId,
        date: {
          gte: startOfTargetDate,
          lte: endOfTargetDate
        }
      });

      // Case A: The deleted occurrence is fromDate (the start of the shift series)
      if (targetDate.getTime() === fromDate.getTime()) {
        const nextOccurrence = new Date(fromDate);
        nextOccurrence.setDate(nextOccurrence.getDate() + incrementDays);

        if (untilDate && nextOccurrence > untilDate) {
          await safeDeleteAssignments({ shiftId });
          await prisma.shift.delete({ where: { id: shiftId } });
        } else {
          await prisma.shift.update({
            where: { id: shiftId },
            data: { fromDate: nextOccurrence }
          });
        }
        return NextResponse.json({ message: 'Shift occurrence deleted successfully' });
      }

      // Case B: The deleted occurrence is at or after untilDate
      if (untilDate && targetDate.getTime() >= untilDate.getTime()) {
        const prevOccurrence = new Date(targetDate);
        prevOccurrence.setDate(prevOccurrence.getDate() - incrementDays);

        if (prevOccurrence < fromDate) {
          await safeDeleteAssignments({ shiftId });
          await prisma.shift.delete({ where: { id: shiftId } });
        } else {
          await prisma.shift.update({
            where: { id: shiftId },
            data: { untilDate: prevOccurrence }
          });
        }
        return NextResponse.json({ message: 'Shift occurrence deleted successfully' });
      }

      // Case C: The deleted occurrence is in the middle
      // Split the recurring shift into two parts:
      // Part 1: fromDate -> previous occurrence
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - 1);
      prevDate.setHours(23, 59, 59, 999);

      await prisma.shift.update({
        where: { id: shiftId },
        data: { untilDate: prevDate }
      });

      // Part 2: next occurrence date -> untilDate
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + incrementDays);
      nextDate.setHours(0, 0, 0, 0);

      if (!untilDate || nextDate <= untilDate) {
        const uniqueUserIds = [...new Set(existingShift.assignments.map(a => a.userId))];

        const newShift = await prisma.shift.create({
          data: {
            serviceSeekerId: existingShift.serviceSeekerId,
            fromDate: nextDate,
            untilDate: existingShift.untilDate,
            recurrence: existingShift.recurrence,
            startTime: existingShift.startTime,
            endTime: existingShift.endTime,
            shiftTypeId: existingShift.shiftTypeId,
            totalStaffRequired: existingShift.totalStaffRequired,
            funderId: existingShift.funderId,
            timeCritical: existingShift.timeCritical,
            shiftRunId: existingShift.shiftRunId,
            notesForCarers: existingShift.notesForCarers,
            notesForManager: existingShift.notesForManager,
            createdById: existingShift.createdById,
            updatedById: existingShift.updatedById,
          }
        });

        if (uniqueUserIds.length > 0) {
          const assignmentData = buildShiftAssignmentData({
            shiftId: newShift.id,
            userIds: uniqueUserIds,
            fromDate: newShift.fromDate,
            untilDate: newShift.untilDate,
            recurrence: newShift.recurrence,
          });

          if (assignmentData.length > 0) {
            await prisma.shiftAssignment.createMany({
              data: assignmentData,
              skipDuplicates: true
            });
          }
        }
      }

      return NextResponse.json({ message: 'Shift occurrence deleted successfully' });
    }

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('DELETE /shifts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}

