import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET all maintenance issues
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if Prisma client has the maintenanceIssue model
    if (!prisma.maintenanceIssue) {
      console.warn('Prisma client missing model MaintenanceIssue. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Database model not available. Please run `npx prisma generate` and migrate the database.'
      });
    }

    const { searchParams } = new URL(request.url);
    const issueType = searchParams.get('issueType');
    const completed = searchParams.get('completed');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {};
    
    if (issueType) {
      where.issueType = issueType;
    }
    
    if (completed) {
      where.completed = completed;
    }
    
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate);
      }
    }

    const issues = await prisma.maintenanceIssue.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: issues
    });
  } catch (error) {
    console.error('GET /maintenance-issues error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2001' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Database table does not exist. Please run database migration: `npx prisma migrate dev`',
        details: error.message
      }, { status: 500 });
    }
    
    if (error.code === 'P1001' || error.message?.includes("Can't reach database")) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      }, { status: 503 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance issues', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new maintenance issue
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await request.json();

    // Check if Prisma client has the maintenanceIssue model
    if (!prisma.maintenanceIssue) {
      return NextResponse.json({
        success: false,
        error: 'Database model not available. Please run `npx prisma generate` and migrate the database.'
      }, { status: 500 });
    }

    const {
      issueType,
      for: forField,
      issue,
      repeats,
      issueDate,
      completed,
      photoUrls
    } = body;

    // Validate required fields
    if (!issueType || !issue || !issueDate) {
      return NextResponse.json(
        { success: false, error: 'Issue Type, Issue, and Issue Date are required' },
        { status: 400 }
      );
    }

    const maintenanceIssue = await prisma.maintenanceIssue.create({
      data: {
        issueType,
        for: forField || null,
        issue,
        repeats: repeats || 'NO',
        issueDate: new Date(issueDate),
        completed: completed || 'NO',
        photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
        createdById: decoded.userId,
        updatedById: decoded.userId
      },
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
      data: maintenanceIssue
    }, { status: 201 });
  } catch (error) {
    console.error('POST /maintenance-issues error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2001' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Database table does not exist. Please run database migration: `npx prisma migrate dev`',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance issue', details: error.message },
      { status: 500 }
    );
  }
}

