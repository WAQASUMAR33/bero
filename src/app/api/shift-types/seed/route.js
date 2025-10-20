'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST /api/shift-types/seed - Seed default shift types
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const defaultShiftTypes = [
      { name: 'Live in care', careerPayRegular: 150, careerPayBankHoliday: 180, payCalculation: 'PER_SHIFT' },
      { name: 'Shadow 10am - 6pm', careerPayRegular: 15, careerPayBankHoliday: 20, payCalculation: 'PER_HOUR' },
      { name: 'Shadow 10am-5pm', careerPayRegular: 15, careerPayBankHoliday: 20, payCalculation: 'PER_HOUR' },
      { name: 'SL 08:00 to 08:00 sleep', careerPayRegular: 140, careerPayBankHoliday: 170, payCalculation: 'PER_SHIFT' },
      { name: 'SL 10AM-6PM', careerPayRegular: 16, careerPayBankHoliday: 22, payCalculation: 'PER_HOUR' },
      { name: 'SL 9am-10am', careerPayRegular: 16, careerPayBankHoliday: 22, payCalculation: 'PER_HOUR' },
      { name: 'SL LD 10AM - 10PM', careerPayRegular: 18, careerPayBankHoliday: 24, payCalculation: 'PER_HOUR' },
      { name: 'SL LD 8am - 8pm', careerPayRegular: 18, careerPayBankHoliday: 24, payCalculation: 'PER_HOUR' },
      { name: 'SL Sleep 10am - 10am', careerPayRegular: 140, careerPayBankHoliday: 170, payCalculation: 'PER_SHIFT' },
      { name: 'SL sleep 10am - 8am', careerPayRegular: 130, careerPayBankHoliday: 160, payCalculation: 'PER_SHIFT' },
      { name: 'SL Sleep 9am - 10am', careerPayRegular: 140, careerPayBankHoliday: 170, payCalculation: 'PER_SHIFT' },
      { name: 'SL Waking Night 10am -10am', careerPayRegular: 160, careerPayBankHoliday: 190, payCalculation: 'PER_SHIFT' },
      { name: 'SW 08:00 to 08:00 sleep', careerPayRegular: 145, careerPayBankHoliday: 175, payCalculation: 'PER_SHIFT' },
      { name: 'SW 10am-11pm', careerPayRegular: 17, careerPayBankHoliday: 23, payCalculation: 'PER_HOUR' },
      { name: 'SW 10am-6pm', careerPayRegular: 17, careerPayBankHoliday: 23, payCalculation: 'PER_HOUR' },
      { name: 'SW LD 08:00 to 20:00', careerPayRegular: 19, careerPayBankHoliday: 25, payCalculation: 'PER_HOUR' },
      { name: 'SW LD 09:00 to 21:00', careerPayRegular: 19, careerPayBankHoliday: 25, payCalculation: 'PER_HOUR' },
      { name: 'SW LD 10am-10pm', careerPayRegular: 19, careerPayBankHoliday: 25, payCalculation: 'PER_HOUR' },
      { name: 'SW Sleep 09:00 to sleep', careerPayRegular: 145, careerPayBankHoliday: 175, payCalculation: 'PER_SHIFT' },
      { name: 'SW Sleep 10AM-10AM', careerPayRegular: 145, careerPayBankHoliday: 175, payCalculation: 'PER_SHIFT' },
      { name: 'SW Sleep 6PM - 10AM', careerPayRegular: 135, careerPayBankHoliday: 165, payCalculation: 'PER_SHIFT' },
      { name: 'SW Waking Night 10AM - 10AM', careerPayRegular: 165, careerPayBankHoliday: 195, payCalculation: 'PER_SHIFT' },
      { name: 'SW Waking Night 22:00 to 10:00', careerPayRegular: 135, careerPayBankHoliday: 165, payCalculation: 'PER_SHIFT' },
      { name: 'SW Waking Night 6PM - 10AM', careerPayRegular: 155, careerPayBankHoliday: 185, payCalculation: 'PER_SHIFT' },
      { name: 'SW Walking Night 20:00 to 08:00', careerPayRegular: 135, careerPayBankHoliday: 165, payCalculation: 'PER_SHIFT' },
      { name: 'Training in the office', careerPayRegular: 15, careerPayBankHoliday: 15, payCalculation: 'PER_HOUR' },
    ];

    const created = [];
    for (const shiftType of defaultShiftTypes) {
      const existing = await prisma.shiftType.findUnique({
        where: { name: shiftType.name }
      });
      if (!existing) {
        const newShiftType = await prisma.shiftType.create({
          data: shiftType
        });
        created.push(newShiftType);
      }
    }

    return NextResponse.json({ 
      message: `Seeded ${created.length} shift types successfully`,
      created
    }, { status: 201 });
  } catch (error) {
    console.error('POST /shift-types/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed shift types' }, { status: 500 });
  }
}

