'use server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });

    const [items, progress] = await Promise.all([
      prisma.inductionItem.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] }),
      prisma.staffInductionProgress.findMany({
        where: { userId: parseInt(userId) },
        include: { signedOffBy: { select: { id: true, firstName: true, lastName: true } } }
      })
    ]);

    const progressMap = {};
    progress.forEach(p => { progressMap[p.inductionItemId] = p; });

    const result = items.map(item => ({
      ...item,
      progress: progressMap[item.id] || null,
      completed: !!progressMap[item.id]?.completedAt
    }));

    const completedCount = result.filter(r => r.completed).length;

    return NextResponse.json({
      success: true,
      data: { items: result, total: items.length, completed: completedCount }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const body = await request.json();
    const { userId, inductionItemId, notes } = body;
    if (!userId || !inductionItemId) return NextResponse.json({ success: false, error: 'userId and inductionItemId are required' }, { status: 400 });

    const progress = await prisma.staffInductionProgress.upsert({
      where: { userId_inductionItemId: { userId: parseInt(userId), inductionItemId: parseInt(inductionItemId) } },
      create: {
        userId: parseInt(userId),
        inductionItemId: parseInt(inductionItemId),
        completedAt: new Date(),
        signedOffById: decoded.userId,
        notes
      },
      update: {
        completedAt: new Date(),
        signedOffById: decoded.userId,
        notes
      },
      include: { signedOffBy: { select: { id: true, firstName: true, lastName: true } } }
    });
    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
