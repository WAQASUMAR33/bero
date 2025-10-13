import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET single shift run
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const shiftRun = await prisma.shiftRun.findUnique({
      where: { id },
      include: {
        shifts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!shiftRun) {
      return NextResponse.json(
        { success: false, error: 'Shift run not found' },
        { status: 404 }
      );
    }

    const shiftRunWithCount = {
      ...shiftRun,
      totalShifts: shiftRun.shifts.length,
      shifts: undefined,
    };

    return NextResponse.json({
      success: true,
      data: shiftRunWithCount,
    });
  } catch (error) {
    console.error('Error fetching shift run:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update shift run
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const shiftRun = await prisma.shiftRun.update({
      where: { id },
      data: {
        name,
      },
      include: {
        shifts: {
          select: {
            id: true,
          },
        },
      },
    });

    const shiftRunWithCount = {
      ...shiftRun,
      totalShifts: shiftRun.shifts.length,
      shifts: undefined,
    };

    return NextResponse.json({
      success: true,
      data: shiftRunWithCount,
    });
  } catch (error) {
    console.error('Error updating shift run:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE shift run
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if shift run has any shifts
    const shiftRun = await prisma.shiftRun.findUnique({
      where: { id },
      include: {
        shifts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!shiftRun) {
      return NextResponse.json(
        { success: false, error: 'Shift run not found' },
        { status: 404 }
      );
    }

    if (shiftRun.shifts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete shift run with associated shifts' },
        { status: 400 }
      );
    }

    await prisma.shiftRun.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Shift run deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shift run:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

