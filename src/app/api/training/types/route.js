'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const types = await prisma.trainingType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: types });
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
    const { name, description, expiryMonths, isMandatory } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const type = await prisma.trainingType.create({
      data: { name, description, expiryMonths: expiryMonths ? parseInt(expiryMonths) : null, isMandatory: isMandatory ?? true }
    });
    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Training type already exists' }, { status: 400 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
