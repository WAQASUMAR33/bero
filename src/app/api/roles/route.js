import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
// Default system roles fallback if database is not reachable or empty
const FALLBACK_ROLES = [
  { id: 1, name: 'ADMIN', displayName: 'Administrator', description: 'Full system access', isSystem: true },
  { id: 2, name: 'CAREWORKER', displayName: 'Care Worker', description: 'Care worker access', isSystem: true },
  { id: 3, name: 'DIRECTOR', displayName: 'Director', description: 'Senior management with strategic oversight', isSystem: true },
  { id: 4, name: 'HR', displayName: 'HR', description: 'Human Resources with staff management access', isSystem: true },
  { id: 5, name: 'REGISTER_MANAGER', displayName: 'Register Manager', description: 'Registered manager with operational oversight', isSystem: true },
  { id: 6, name: 'SUPPORT_WORKER', displayName: 'Support Worker', description: 'Support staff with limited access to tasks and shifts', isSystem: true },
  { id: 9, name: 'BUSINESS_DEVELOPMENT_MANAGER', displayName: 'BDM', description: 'Oversight of marketing and operations', isSystem: false },
  { id: 10, name: 'DEPUTY_MANAGER', displayName: 'Deputy', description: 'Supported Registered Manager', isSystem: false },
  { id: 11, name: 'SERVICE_LEAD', displayName: 'Service Lead', description: 'Responsible for day to day service', isSystem: false },
  { id: 12, name: 'CARE_TAKER', displayName: 'Care Taker', description: 'Care taker access', isSystem: false },
];

// GET all roles
export async function GET(request) {
  try {
    const roles = await prisma.roleDefinition.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (!roles || roles.length === 0) {
      return NextResponse.json(FALLBACK_ROLES);
    }

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles from DB, returning fallback roles:', error);
    return NextResponse.json(FALLBACK_ROLES);
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

