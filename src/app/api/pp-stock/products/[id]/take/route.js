import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST - Take stock (reduce quantity)
export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    const { quantity } = body;

    // Validate required fields
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

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

    // Check if enough stock available
    if (product.currentQuantity < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock available' },
        { status: 400 }
      );
    }

    // Create transaction and update quantity in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.pPStockTransaction.create({
        data: {
          productId,
          action: 'TAKEN',
          quantity: parseInt(quantity),
          userId: decoded.userId
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Update product quantity
      const updatedProduct = await tx.pPProduct.update({
        where: { id: productId },
        data: {
          currentQuantity: {
            decrement: parseInt(quantity)
          }
        }
      });

      return { transaction, product: updatedProduct };
    });

    return NextResponse.json({
      success: true,
      data: result.product
    });
  } catch (error) {
    console.error('POST /pp-stock/products/[id]/take error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to take stock', details: error.message },
      { status: 500 }
    );
  }
}

