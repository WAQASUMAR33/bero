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

// POST add review to policy
export async function POST(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { reviewText } = body;

    // Validate required fields
    if (!reviewText || reviewText.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Review text is required' },
        { status: 400 }
      );
    }

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

    // Create review
    const review = await prisma.policyReview.create({
      data: {
        policyId: id,
        reviewText: reviewText.trim(),
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Update policy's lastReviewed if needed
    await prisma.policy.update({
      where: { id },
      data: {
        lastReviewed: new Date()
      }
    });

    const transformedReview = {
      id: review.id,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
      createdBy: {
        id: review.createdBy.id,
        firstName: review.createdBy.firstName,
        lastName: review.createdBy.lastName,
        email: review.createdBy.email
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedReview
    });
  } catch (error) {
    console.error('Error adding policy review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add policy review' },
      { status: 500 }
    );
  }
}

