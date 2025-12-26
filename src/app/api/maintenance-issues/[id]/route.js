import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET single maintenance issue
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const issue = await prisma.maintenanceIssue.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { success: false, error: 'Maintenance issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('GET /maintenance-issues/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance issue' },
      { status: 500 }
    );
  }
}

// PUT - Update maintenance issue
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const {
      issueType,
      for: forField,
      issue: issueDescription,
      repeats,
      issueDate,
      completed,
      photoUrls
    } = body;

    const updateData = {
      updatedById: decoded.userId
    };

    if (issueType !== undefined) updateData.issueType = issueType;
    if (forField !== undefined) updateData.for = forField || null;
    if (issueDescription !== undefined) updateData.issue = issueDescription;
    if (repeats !== undefined) updateData.repeats = repeats;
    if (issueDate !== undefined) updateData.issueDate = new Date(issueDate);
    if (completed !== undefined) updateData.completed = completed;
    if (photoUrls !== undefined) updateData.photoUrls = photoUrls ? JSON.stringify(photoUrls) : null;

    const updatedIssue = await prisma.maintenanceIssue.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('PUT /maintenance-issues/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance issue', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete maintenance issue
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.maintenanceIssue.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance issue deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /maintenance-issues/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete maintenance issue' },
      { status: 500 }
    );
  }
}

