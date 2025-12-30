import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all products
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if Prisma client has the model
    if (!prisma.pPProduct) {
      return NextResponse.json({
        success: false,
        error: 'Database model not available. Please run `npx prisma generate` and migrate the database.',
        message: 'Please run: npx prisma migrate dev --name add_ppe_stock && npx prisma generate'
      }, { status: 500 });
    }

    const products = await prisma.pPProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('GET /pp-stock/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const { name, threshold, initialQuantity } = body;

    // Validate required fields
    if (!name || threshold === undefined || threshold === null) {
      return NextResponse.json(
        { success: false, error: 'Name and threshold are required' },
        { status: 400 }
      );
    }

    // Check if Prisma client has the model
    if (!prisma.pPProduct) {
      return NextResponse.json({
        success: false,
        error: 'Database model not available. Please run `npx prisma generate` and migrate the database.',
        message: 'Please run: npx prisma migrate dev --name add_ppe_stock && npx prisma generate'
      }, { status: 500 });
    }

    // Check if product with same name already exists (case-insensitive check)
    const allProducts = await prisma.pPProduct.findMany({
      select: { name: true }
    });
    const existingProduct = allProducts.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with this name already exists' },
        { status: 400 }
      );
    }

    const product = await prisma.pPProduct.create({
      data: {
        name: name.trim(),
        threshold: parseInt(threshold) || 0,
        currentQuantity: parseInt(initialQuantity) || 0
      }
    });

    // If initial quantity is provided, create a PURCHASE transaction
    if (initialQuantity && parseInt(initialQuantity) > 0) {
      await prisma.pPStockTransaction.create({
        data: {
          productId: product.id,
          action: 'PURCHASE',
          quantity: parseInt(initialQuantity),
          userId: decoded.userId
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 });
  } catch (error) {
    console.error('POST /pp-stock/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}

