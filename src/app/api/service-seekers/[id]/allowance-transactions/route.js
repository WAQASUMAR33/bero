'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const rows = await prisma.serviceSeekerAllowanceTransaction.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows || [], { status: 200 });
  } catch (e) {
    console.error('GET allowance-transactions error:', e);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const b = await request.json();
    
    // Calculate balance from previous transactions
    const previousTransactions = await prisma.serviceSeekerAllowanceTransaction.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    
    const previousBalance = previousTransactions.length > 0 ? previousTransactions[0].balance : 0;
    const amount = parseFloat(b.amount) || 0;
    const newBalance = b.transaction === 'Credit' 
      ? previousBalance + amount 
      : previousBalance - amount;

    const created = await prisma.serviceSeekerAllowanceTransaction.create({
      data: {
        serviceSeekerId,
        transaction: b.transaction || 'Credit',
        amount: amount,
        balance: newBalance,
        isAllowance: b.isAllowance === true || b.isAllowance === 'true',
        item: b.item || null,
        signature: b.signature || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST allowance-transactions error:', e);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const row = await prisma.serviceSeekerAllowanceTransaction.findFirst({ 
      where: { id, serviceSeekerId } 
    });
    if (!row) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await prisma.serviceSeekerAllowanceTransaction.delete({ where: { id } });
    
    // Recalculate balances for remaining transactions
    const remainingTransactions = await prisma.serviceSeekerAllowanceTransaction.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'asc' },
    });
    
    let runningBalance = 0;
    for (const trans of remainingTransactions) {
      runningBalance = trans.transaction === 'Credit' 
        ? runningBalance + trans.amount 
        : runningBalance - trans.amount;
      await prisma.serviceSeekerAllowanceTransaction.update({
        where: { id: trans.id },
        data: { balance: runningBalance },
      });
    }
    
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (e) {
    console.error('DELETE allowance-transactions error:', e);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

