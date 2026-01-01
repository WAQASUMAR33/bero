import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET policy history (creates, edits, signatures)
export async function GET(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Check if policy exists
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            signedAt: 'desc'
          }
        },
        reviews: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    // Build history timeline
    const history = [];

    // Add creation event
    history.push({
      type: 'CREATED',
      user: {
        id: policy.createdBy.id,
        firstName: policy.createdBy.firstName,
        lastName: policy.createdBy.lastName,
        email: policy.createdBy.email
      },
      timestamp: policy.createdAt,
      description: 'Policy created'
    });

    // Add update events (if updated by different user or at different time)
    if (policy.updatedAt.getTime() !== policy.createdAt.getTime() || 
        policy.updatedBy.id !== policy.createdBy.id) {
      history.push({
        type: 'UPDATED',
        user: {
          id: policy.updatedBy.id,
          firstName: policy.updatedBy.firstName,
          lastName: policy.updatedBy.lastName,
          email: policy.updatedBy.email
        },
        timestamp: policy.updatedAt,
        description: 'Policy updated'
      });
    }

    // Add signature events
    policy.signatures.forEach(signature => {
      history.push({
        type: 'SIGNED',
        user: {
          id: signature.user.id,
          firstName: signature.user.firstName,
          lastName: signature.user.lastName,
          email: signature.user.email
        },
        timestamp: signature.signedAt,
        description: 'Policy signed'
      });
    });

    // Add review events
    policy.reviews.forEach(review => {
      history.push({
        type: 'REVIEWED',
        user: {
          id: review.createdBy.id,
          firstName: review.createdBy.firstName,
          lastName: review.createdBy.lastName,
          email: review.createdBy.email
        },
        timestamp: review.createdAt,
        description: 'Policy reviewed',
        reviewText: review.reviewText
      });
    });

    // Sort by timestamp (most recent first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching policy history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policy history' },
      { status: 500 }
    );
  }
}

