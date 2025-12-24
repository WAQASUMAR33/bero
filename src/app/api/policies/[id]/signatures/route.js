import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all signatures for a policy
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

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

    const signatures = await prisma.policySignature.findMany({
      where: { policyId: id },
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
    });

    const totalStaffCount = await prisma.user.count({
      where: {
        status: 'CURRENT'
      }
    });

    const transformedSignatures = signatures.map(signature => ({
      id: signature.id,
      userId: signature.userId,
      signedAt: signature.signedAt,
      user: {
        id: signature.user.id,
        firstName: signature.user.firstName,
        lastName: signature.user.lastName,
        email: signature.user.email
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        signatures: transformedSignatures,
        signedCount: signatures.length,
        totalStaffCount: totalStaffCount
      }
    });
  } catch (error) {
    console.error('Error fetching policy signatures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policy signatures' },
      { status: 500 }
    );
  }
}

