import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET single product
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const productId = parseInt(id);

    const product = await prisma.pPProduct.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('GET /pp-stock/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    const { name, threshold } = body;

    // Validate required fields
    if (!name || threshold === undefined || threshold === null) {
      return NextResponse.json(
        { success: false, error: 'Name and threshold are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.pPProduct.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if another product with same name exists (case-insensitive check)
    const allProducts = await prisma.pPProduct.findMany({
      where: { id: { not: productId } },
      select: { name: true }
    });
    const duplicateProduct = allProducts.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with this name already exists' },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.pPProduct.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        threshold: parseInt(threshold) || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('PUT /pp-stock/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request, { params }) {
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

    // Delete product (transactions will be cascade deleted)
    await prisma.pPProduct.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /pp-stock/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}

