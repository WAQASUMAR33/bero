'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const requirements = await prisma.roleTrainingRequirement.findMany({
      include: { trainingType: true },
      orderBy: [{ roleName: 'asc' }, { trainingType: { name: 'asc' } }]
    });
    return NextResponse.json({ success: true, data: requirements });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { roleName, trainingTypeId, levelRequired } = body;
    if (!roleName || !trainingTypeId) return NextResponse.json({ success: false, error: 'roleName and trainingTypeId required' }, { status: 400 });

    const req = await prisma.roleTrainingRequirement.create({
      data: { roleName, trainingTypeId: parseInt(trainingTypeId), levelRequired },
      include: { trainingType: true }
    });
    return NextResponse.json({ success: true, data: req });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'This requirement already exists' }, { status: 400 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    await prisma.roleTrainingRequirement.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
