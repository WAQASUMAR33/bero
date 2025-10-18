import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_INCIDENT_TYPES = [
  'Bruise',
  'Burn',
  'Fainted',
  'Fall',
  'Graze',
  'Heart Attack',
  'Medication Error',
  'Near Miss',
  'No Injury',
  'Red Mark',
  'Scratch',
  'Seizure',
  'Skin Tear',
  'Slipped',
  'Stroke',
  'Tripped',
  'Vomited'
];

export async function POST(request) {
  try {
    const created = [];
    
    for (const type of DEFAULT_INCIDENT_TYPES) {
      const existing = await prisma.incidentType.findUnique({ where: { type } });
      if (!existing) {
        const item = await prisma.incidentType.create({ 
          data: { 
            type,
            canEdit: false  // Default types cannot be edited/deleted
          } 
        });
        created.push(item);
      }
    }

    return NextResponse.json({ 
      message: `Seeded ${created.length} default incident types`,
      created 
    });
  } catch (error) {
    console.error('POST /api/incident-types/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed incident types' }, { status: 500 });
  }
}

