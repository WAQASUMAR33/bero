'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const DEFAULT_TRIGGERS = [
  { name: 'Communication to express emotion to other', define: 'Using behaviour to communicate feelings or needs' },
  { name: 'Escape/Avoidance', define: 'Behaviour to avoid or escape from a situation' },
  { name: 'Not known', define: 'Trigger is unclear or unknown' },
  { name: 'Pain/Feeling unwell', define: 'Behaviour related to physical discomfort or illness' },
  { name: 'Sensory because it feels good', define: 'Behaviour for sensory stimulation or pleasure' },
  { name: 'Social attention', define: 'Behaviour to gain attention from others' },
  { name: 'Tangible', define: 'Behaviour to obtain a desired item or activity' },
];

// POST /api/behaviour-triggers/seed
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is admin (optional - you can remove this if not needed)
    // const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { role: true } });
    // if (user?.role?.name !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const results = [];
    for (const trigger of DEFAULT_TRIGGERS) {
      try {
        const existing = await prisma.behaviourTrigger.findUnique({
          where: { name: trigger.name }
        });
        
        if (!existing) {
          const created = await prisma.behaviourTrigger.create({
            data: trigger
          });
          results.push({ status: 'created', trigger: created });
        } else {
          results.push({ status: 'exists', trigger: existing });
        }
      } catch (err) {
        results.push({ status: 'error', name: trigger.name, error: err.message });
      }
    }

    return NextResponse.json({ 
      message: 'Seed completed', 
      results 
    }, { status: 200 });
  } catch (error) {
    console.error('POST /behaviour-triggers/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed behaviour triggers' }, { status: 500 });
  }
}

