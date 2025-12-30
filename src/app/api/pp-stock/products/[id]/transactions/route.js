import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all transactions for a product
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const productId = parseInt(id);

    // Check if product exists
    const product = await prisma.pPProduct.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const transactions = await prisma.pPStockTransaction.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('GET /pp-stock/products/[id]/transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}

