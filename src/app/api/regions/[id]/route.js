import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET single region
export async function GET(request, { params }) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { id } = await params;

    const region = await prisma.region.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }
      }
    });

    if (!region) {
      return NextResponse.json(
        { success: false, error: 'Region not found' },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedRegion = {
      id: region.id,
      title: region.title,
      code: region.code,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
      totalUsers: region.users.length,
      activeUsers: region.users.filter(user => user.status === 'CURRENT').length
    };

    return NextResponse.json({
      success: true,
      data: transformedRegion
    });
  } catch (error) {
    console.error('Error fetching region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch region' },
      { status: 500 }
    );
  }
}

// PUT update region
export async function PUT(request, { params }) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { id } = await params;
    const body = await request.json();
    const { title, code } = body;

    // Validate required fields
    if (!title || !code) {
      return NextResponse.json(
        { success: false, error: 'Title and code are required' },
        { status: 400 }
      );
    }

    // Check if region with same code already exists, excluding current region
    const existingRegion = await prisma.region.findFirst({
      where: {
        code,
        id: {
          not: id,
        },
      },
    });

    if (existingRegion) {
      return NextResponse.json(
        { success: false, error: 'Region with this code already exists' },
        { status: 400 }
      );
    }

    const updatedRegion = await prisma.region.update({
      where: { id },
      data: {
        title,
        code
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }
      }
    });

    // Transform the data
    const transformedRegion = {
      id: updatedRegion.id,
      title: updatedRegion.title,
      code: updatedRegion.code,
      createdAt: updatedRegion.createdAt,
      updatedAt: updatedRegion.updatedAt,
      totalUsers: updatedRegion.users.length,
      activeUsers: updatedRegion.users.filter(user => user.status === 'CURRENT').length
    };

    return NextResponse.json({
      success: true,
      data: transformedRegion
    });
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update region' },
      { status: 500 }
    );
  }
}

// DELETE region
export async function DELETE(request, { params }) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { id } = await params;

    // Check if region exists and has associated users
    const regionWithUsers = await prisma.region.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!regionWithUsers) {
      return NextResponse.json(
        { success: false, error: 'Region not found' },
        { status: 404 }
      );
    }

    if (regionWithUsers.users.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete region with associated users' },
        { status: 400 }
      );
    }

    await prisma.region.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete region' },
      { status: 500 }
    );
  }
}
