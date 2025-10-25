import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET single role
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = params;
    const roleId = parseInt(id);

    const role = await prisma.roleDefinition.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT update role
export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = params;
    const roleId = parseInt(id);
    const { name, displayName, description, permissions } = await request.json();

    // Check if role exists and is not a system role
    const existingRole = await prisma.roleDefinition.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 403 });
    }

    const updateData = {};
    
    if (name) updateData.name = name.toUpperCase().replace(/\s+/g, '_');
    if (displayName) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;

    const role = await prisma.roleDefinition.update({
      where: { id: roleId },
      data: updateData
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE role
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { id } = params;
    const roleId = parseInt(id);

    // Check if role exists and is not a system role
    const existingRole = await prisma.roleDefinition.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 });
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${existingRole._count.users} user(s) are assigned to this role.` 
      }, { status: 400 });
    }

    await prisma.roleDefinition.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}

