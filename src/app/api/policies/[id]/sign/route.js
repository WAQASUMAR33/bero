import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user ID from token
function getUserIdFromToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST sign policy
export async function POST(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Check if policy exists
    const policy = await prisma.policy.findUnique({
      where: { id }
    });

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    // Check if user already signed
    const existingSignature = await prisma.policySignature.findUnique({
      where: {
        policyId_userId: {
          policyId: id,
          userId: userId
        }
      }
    });

    if (existingSignature) {
      return NextResponse.json(
        { success: false, error: 'You have already signed this policy' },
        { status: 400 }
      );
    }

    // Create signature
    const signature = await prisma.policySignature.create({
      data: {
        policyId: id,
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const transformedSignature = {
      id: signature.id,
      userId: signature.userId,
      signedAt: signature.signedAt,
      user: {
        id: signature.user.id,
        firstName: signature.user.firstName,
        lastName: signature.user.lastName,
        email: signature.user.email
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedSignature
    });
  } catch (error) {
    console.error('Error signing policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign policy' },
      { status: 500 }
    );
  }
}

