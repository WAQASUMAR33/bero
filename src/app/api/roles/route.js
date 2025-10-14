import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET all roles
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const roles = await prisma.roleDefinition.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST create new role
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const { name, displayName, description, permissions } = await request.json();

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }

    const role = await prisma.roleDefinition.create({
      data: {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        displayName,
        description: description || '',
        permissions: permissions || [],
        isSystem: false
      }
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

