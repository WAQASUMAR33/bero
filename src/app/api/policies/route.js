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

// GET all policies
export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);

    const policies = await prisma.policy.findMany({
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
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            signatures: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include signature count and total staff count
    const totalStaffCount = await prisma.user.count({
      where: {
        status: 'CURRENT'
      }
    });

    const transformedPolicies = policies.map(policy => {
      // Check if current user has signed
      const isSigned = userId ? policy.signatures.some(sig => sig.userId === userId) : false;

      return {
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
        reviewCount: policy._count.reviews,
        isSigned: isSigned // Add this field
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPolicies
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// POST create new policy (Admin only)
export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, fileName, fileUrl, reviewIn } = body;

    // Validate required fields
    if (!name || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Policy name and file name are required' },
        { status: 400 }
      );
    }

    // Check if user is admin (you can add role checking here)
    // For now, we'll allow any authenticated user to create policies
    // You can add role checking later

    const policy = await prisma.policy.create({
      data: {
        name,
        fileName,
        fileUrl: fileUrl || null,
        reviewIn: reviewIn ? parseInt(reviewIn) : null,
        createdById: userId,
        updatedById: userId
      },
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
        }
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
      signedCount: 0,
      totalStaffCount: 0,
      reviewCount: 0
    };

    // Notify all care workers about the new policy (OPTIMIZED: limit batch size)
    try {
      const careWorkers = await prisma.user.findMany({
        where: {
          role: { name: 'CARE_WORKER' },
          status: 'CURRENT',
          id: { not: userId }
        },
        select: { id: true },
        take: 500 // Limit to prevent excessive notifications
      });

      if (careWorkers.length > 0) {
        // Batch create in chunks of 100 to prevent connection issues
        const BATCH_SIZE = 100;
        for (let i = 0; i < careWorkers.length; i += BATCH_SIZE) {
          const batch = careWorkers.slice(i, i + BATCH_SIZE);
          await prisma.notification.createMany({
            data: batch.map(worker => ({
              userId: worker.id,
              title: 'New Policy Uploaded',
              message: `A new policy "${name}" has been uploaded. Please review and sign it.`,
              type: 'INFO',
              link: '/care-worker/policies',
              isRead: false
            })),
            skipDuplicates: true
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to create policy notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: transformedPolicy
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}

