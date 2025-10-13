import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET all funders
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const paymentType = searchParams.get('paymentType') || '';

    const where = {};
    
    if (search) {
      where.OR = [
        { fundingSource: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { serviceType: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (paymentType && paymentType !== 'all') {
      where.paymentType = paymentType;
    }

    const funders = await prisma.funder.findMany({
      where,
      include: {
        shifts: {
          select: {
            id: true,
            fromDate: true,
            untilDate: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend expectations
    const transformedFunders = funders.map(funder => ({
      id: funder.id,
      name: funder.fundingSource,
      contractNumber: funder.contractNumber,
      serviceType: funder.serviceType,
      costNotes: funder.costNotes,
      paymentType: funder.paymentType,
      createdAt: funder.createdAt,
      updatedAt: funder.updatedAt,
      activeShifts: funder.shifts.filter(shift => {
        // Consider a shift active if it has a fromDate and (untilDate is null or in the future)
        const now = new Date();
        return shift.fromDate && (!shift.untilDate || new Date(shift.untilDate) > now);
      }).length,
      totalShifts: funder.shifts.length
    }));

    return NextResponse.json({
      success: true,
      data: transformedFunders
    });

  } catch (error) {
    console.error('Error fetching funders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funders' },
      { status: 500 }
    );
  }
}

// POST create new funder
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contractNumber, serviceType, costNotes, paymentType } = body;

    // Validate required fields
    if (!name || !contractNumber || !serviceType || !paymentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if funder with same contract number already exists
    const existingFunder = await prisma.funder.findFirst({
      where: { contractNumber }
    });

    if (existingFunder) {
      return NextResponse.json(
        { success: false, error: 'Funder with this contract number already exists' },
        { status: 400 }
      );
    }

    const funder = await prisma.funder.create({
      data: {
        fundingSource: name,
        contractNumber,
        serviceType,
        costNotes: costNotes || '',
        paymentType
      },
      include: {
        shifts: true
      }
    });

    // Transform the data to match frontend expectations
    const transformedFunder = {
      id: funder.id,
      name: funder.fundingSource,
      contractNumber: funder.contractNumber,
      serviceType: funder.serviceType,
      costNotes: funder.costNotes,
      paymentType: funder.paymentType,
      createdAt: funder.createdAt,
      updatedAt: funder.updatedAt,
      activeShifts: 0,
      totalShifts: 0
    };

    return NextResponse.json({
      success: true,
      data: transformedFunder
    });

  } catch (error) {
    console.error('Error creating funder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create funder' },
      { status: 500 }
    );
  }
}
