import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    await prisma.$connect();
    
    // Create sample regions
    const sampleRegions = [
      { title: 'North Region', code: 'NR001' },
      { title: 'South Region', code: 'SR002' },
      { title: 'East Region', code: 'ER003' },
      { title: 'West Region', code: 'WR004' },
      { title: 'Central Region', code: 'CR005' }
    ];

    const createdRegions = [];
    
    for (const regionData of sampleRegions) {
      // Check if region already exists
      const existing = await prisma.region.findFirst({
        where: { code: regionData.code }
      });
      
      if (!existing) {
        const region = await prisma.region.create({
          data: regionData,
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
        
        const transformedRegion = {
          id: region.id,
          title: region.title,
          code: region.code,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
          totalUsers: region.users.length,
          activeUsers: region.users.filter(user => user.status === 'CURRENT').length
        };
        
        createdRegions.push(transformedRegion);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdRegions.length} sample regions`,
      data: createdRegions
    });
  } catch (error) {
    console.error('Error seeding regions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed regions', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

