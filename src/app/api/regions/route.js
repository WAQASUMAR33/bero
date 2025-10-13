import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET all regions
export async function GET(request) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    const where = searchTerm ? {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
      ],
    } : {};

    const regions = await prisma.region.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to include user counts
    const transformedRegions = regions.map(region => ({
      id: region.id,
      title: region.title,
      code: region.code,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
      totalUsers: region.users.length,
      activeUsers: region.users.filter(user => user.status === 'CURRENT').length
    }));

    return NextResponse.json({
      success: true,
      data: transformedRegions
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    
    // If database is not accessible, return empty array so UI can still work
    if (error.code === 'P1001' || error.message.includes('Can\'t reach database')) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Database connection failed, returning empty data'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regions', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new region
export async function POST(request) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const body = await request.json();
    const { title, code } = body;

    // Validate required fields
    if (!title || !code) {
      return NextResponse.json(
        { success: false, error: 'Title and code are required' },
        { status: 400 }
      );
    }

    // Check if region with same code already exists
    const existingRegion = await prisma.region.findFirst({
      where: { code }
    });

    if (existingRegion) {
      return NextResponse.json(
        { success: false, error: 'Region with this code already exists' },
        { status: 400 }
      );
    }

    const region = await prisma.region.create({
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create region' },
      { status: 500 }
    );
  }
}
