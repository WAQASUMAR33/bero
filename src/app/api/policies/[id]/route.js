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

// GET policy by ID
export async function GET(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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
        },
        _count: {
          select: {
            signatures: true,
            reviews: true
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

    const totalStaffCount = await prisma.user.count({
      where: {
        status: 'CURRENT'
      }
    });

    const transformedPolicy = {
      id: policy.id,
      name: policy.name,
      fileName: policy.fileName,
      fileUrl: policy.fileUrl,
      reviewIn: policy.reviewIn,
      lastReviewed: policy.lastReviewed,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      createdBy: {
        id: policy.createdBy.id,
        firstName: policy.createdBy.firstName,
        lastName: policy.createdBy.lastName,
        email: policy.createdBy.email
      },
      updatedBy: {
        id: policy.updatedBy.id,
        firstName: policy.updatedBy.firstName,
        lastName: policy.updatedBy.lastName,
        email: policy.updatedBy.email
      },
      signatures: policy.signatures.map(sig => ({
        id: sig.id,
        userId: sig.userId,
        signedAt: sig.signedAt,
        user: {
          id: sig.user.id,
          firstName: sig.user.firstName,
          lastName: sig.user.lastName,
          email: sig.user.email
        }
      })),
      reviews: policy.reviews.map(review => ({
        id: review.id,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        createdBy: {
          id: review.createdBy.id,
          firstName: review.createdBy.firstName,
          lastName: review.createdBy.lastName,
          email: review.createdBy.email
        }
      })),
      signedCount: policy._count.signatures,
      totalStaffCount: totalStaffCount,
      reviewCount: policy._count.reviews
    };

    return NextResponse.json({
      success: true,
      data: transformedPolicy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

// PUT update policy (Admin only)
export async function PUT(request, { params }) {
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
    const body = await request.json();
    const { name, fileName, fileUrl, reviewIn, lastReviewed } = body;

    // Check if policy exists
    const existingPolicy = await prisma.policy.findUnique({
      where: { id }
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    const updateData = {
      updatedById: userId
    };

    if (name !== undefined) updateData.name = name;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (reviewIn !== undefined) updateData.reviewIn = reviewIn ? parseInt(reviewIn) : null;
    if (lastReviewed !== undefined) updateData.lastReviewed = lastReviewed ? new Date(lastReviewed) : null;

    const policy = await prisma.policy.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            signatures: true,
            reviews: true
          }
        }
      }
    });

    const totalStaffCount = await prisma.user.count({
      where: {
        status: 'CURRENT'
      }
    });

    const transformedPolicy = {
      id: policy.id,
      name: policy.name,
      fileName: policy.fileName,
      fileUrl: policy.fileUrl,
      reviewIn: policy.reviewIn,
      lastReviewed: policy.lastReviewed,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      createdBy: {
        id: policy.createdBy.id,
        firstName: policy.createdBy.firstName,
        lastName: policy.createdBy.lastName,
        email: policy.createdBy.email
      },
      updatedBy: {
        id: policy.updatedBy.id,
        firstName: policy.updatedBy.firstName,
        lastName: policy.updatedBy.lastName,
        email: policy.updatedBy.email
      },
      signedCount: policy._count.signatures,
      totalStaffCount: totalStaffCount,
      reviewCount: policy._count.reviews
    };

    return NextResponse.json({
      success: true,
      data: transformedPolicy
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update policy' },
      { status: 500 }
    );
  }
}

