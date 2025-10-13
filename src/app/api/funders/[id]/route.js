import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET single funder
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const funder = await prisma.funder.findUnique({
      where: { id },
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
      }
    });

    if (!funder) {
      return NextResponse.json(
        { success: false, error: 'Funder not found' },
        { status: 404 }
      );
    }

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
      activeShifts: funder.shifts.filter(shift => {
        // Consider a shift active if it has a fromDate and (untilDate is null or in the future)
        const now = new Date();
        return shift.fromDate && (!shift.untilDate || new Date(shift.untilDate) > now);
      }).length,
      totalShifts: funder.shifts.length
    };

    return NextResponse.json({
      success: true,
      data: transformedFunder
    });

  } catch (error) {
    console.error('Error fetching funder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funder' },
      { status: 500 }
    );
  }
}

// PUT update funder
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, contractNumber, serviceType, costNotes, paymentType } = body;

    // Validate required fields
    if (!name || !contractNumber || !serviceType || !paymentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if funder exists
    const existingFunder = await prisma.funder.findUnique({
      where: { id }
    });

    if (!existingFunder) {
      return NextResponse.json(
        { success: false, error: 'Funder not found' },
        { status: 404 }
      );
    }

    // Check if another funder with same contract number exists
    const duplicateFunder = await prisma.funder.findFirst({
      where: { 
        contractNumber,
        id: { not: id }
      }
    });

    if (duplicateFunder) {
      return NextResponse.json(
        { success: false, error: 'Funder with this contract number already exists' },
        { status: 400 }
      );
    }

    const funder = await prisma.funder.update({
      where: { id },
      data: {
        fundingSource: name,
        contractNumber,
        serviceType,
        costNotes: costNotes || '',
        paymentType
      },
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
      activeShifts: funder.shifts.filter(shift => {
        // Consider a shift active if it has a fromDate and (untilDate is null or in the future)
        const now = new Date();
        return shift.fromDate && (!shift.untilDate || new Date(shift.untilDate) > now);
      }).length,
      totalShifts: funder.shifts.length
    };

    return NextResponse.json({
      success: true,
      data: transformedFunder
    });

  } catch (error) {
    console.error('Error updating funder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update funder' },
      { status: 500 }
    );
  }
}

// DELETE funder
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if funder exists
    const existingFunder = await prisma.funder.findUnique({
      where: { id },
      include: {
        shifts: true
      }
    });

    if (!existingFunder) {
      return NextResponse.json(
        { success: false, error: 'Funder not found' },
        { status: 404 }
      );
    }

    // Check if funder has associated shifts
    if (existingFunder.shifts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete funder with associated shifts' },
        { status: 400 }
      );
    }

    await prisma.funder.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Funder deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting funder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete funder' },
      { status: 500 }
    );
  }
}
