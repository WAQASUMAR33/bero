import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SUPPORT_ITEMS = [
  'Personal Care',
  'Mobility Assistance',
  'Medication Support',
  'Emotional Support',
  'Social Activities',
  'Housekeeping',
  'Meal Preparation',
  'Transportation',
  'Exercise/Physical Activity',
  'Communication Support'
];

export async function POST(request) {
  try {
    const created = [];
    
    for (const name of DEFAULT_SUPPORT_ITEMS) {
      const existing = await prisma.supportList.findUnique({ where: { name } });
      if (!existing) {
        const item = await prisma.supportList.create({ data: { name } });
        created.push(item);
      }
    }

    return NextResponse.json({ 
      message: `Seeded ${created.length} default support items`,
      created 
    });
  } catch (error) {
    console.error('POST /api/support-lists/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed support lists' }, { status: 500 });
  }
}

