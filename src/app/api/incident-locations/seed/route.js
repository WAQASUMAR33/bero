import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_LOCATIONS = [
  'Stairway',
  'Other'
];

export async function POST(request) {
  try {
    const created = [];
    
    for (const name of DEFAULT_LOCATIONS) {
      const existing = await prisma.incidentLocation.findUnique({ where: { name } });
      if (!existing) {
        const item = await prisma.incidentLocation.create({ data: { name } });
        created.push(item);
      }
    }

    return NextResponse.json({ 
      message: `Seeded ${created.length} default locations`,
      created 
    });
  } catch (error) {
    console.error('POST /api/incident-locations/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed locations' }, { status: 500 });
  }
}

