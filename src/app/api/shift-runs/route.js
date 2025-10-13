import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET all shift runs
export async function GET() {
  try {
    const shiftRuns = await prisma.shiftRun.findMany({
      include: {
        shifts: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add shift count to each shift run
    const shiftRunsWithCount = shiftRuns.map(shiftRun => ({
      ...shiftRun,
      totalShifts: shiftRun.shifts.length,
      shifts: undefined, // Remove the shifts array, keep only the count
    }));

    return NextResponse.json({
      success: true,
      data: shiftRunsWithCount,
    });
  } catch (error) {
    console.error('Error fetching shift runs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new shift run
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const shiftRun = await prisma.shiftRun.create({
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
    console.error('Error creating shift run:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

