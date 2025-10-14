import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const defaultRoles = [
      {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: [
          'dashboard.view', 'users.manage', 'staff.manage', 'service-users.manage',
          'shifts.manage', 'daily-tasks.manage', 'documents.manage', 'regions.manage',
          'finance.manage', 'reports.view', 'settings.manage', 'roles.manage',
          'audit.view', 'calendar.manage', 'clock-in-out.manage', 'cqc-inspection.manage',
          'quality-assurance.manage', 'holidays.manage', 'handover.manage',
          'maintenance.manage', 'agenda.manage', 'setup.manage', 'incidents.manage',
          'temperature-monitoring.manage', 'well-being.manage'
        ],
        isSystem: true
      },
      {
        name: 'DIRECTOR',
        displayName: 'Director',
        description: 'Director with management permissions',
        permissions: [
          'dashboard.view', 'users.manage', 'staff.manage', 'service-users.manage',
          'shifts.manage', 'daily-tasks.manage', 'documents.manage', 'regions.manage',
          'finance.manage', 'reports.view', 'settings.manage', 'audit.view',
          'calendar.manage', 'cqc-inspection.manage', 'quality-assurance.manage',
          'holidays.manage', 'handover.manage', 'incidents.manage'
        ],
        isSystem: true
      },
      {
        name: 'HR',
        displayName: 'Human Resources',
        description: 'HR staff with user and document management',
        permissions: [
          'dashboard.view', 'users.manage', 'staff.manage', 'documents.manage',
          'reports.view', 'calendar.manage', 'holidays.manage'
        ],
        isSystem: true
      },
      {
        name: 'CAREWORKER',
        displayName: 'Care Worker',
        description: 'Care worker with shift and task permissions',
        permissions: [
          'dashboard.view', 'shifts.manage', 'daily-tasks.manage',
          'documents.manage', 'calendar.manage', 'clock-in-out.manage',
          'handover.manage'
        ],
        isSystem: true
      },
      {
        name: 'SUPPORT_WORKER',
        displayName: 'Support Worker',
        description: 'Support worker with basic permissions',
        permissions: [
          'dashboard.view', 'shifts.manage', 'daily-tasks.manage',
          'calendar.manage', 'clock-in-out.manage', 'handover.manage'
        ],
        isSystem: true
      },
      {
        name: 'REGISTER_MANAGER',
        displayName: 'Register Manager',
        description: 'Register manager with compliance permissions',
        permissions: [
          'dashboard.view', 'staff.manage', 'service-users.manage',
          'shifts.manage', 'documents.manage', 'regions.manage',
          'reports.view', 'calendar.manage', 'cqc-inspection.manage',
          'quality-assurance.manage', 'incidents.manage'
        ],
        isSystem: true
      }
    ];

    const results = [];
    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existing = await prisma.roleDefinition.findUnique({
        where: { name: roleData.name }
      });

      if (!existing) {
        const role = await prisma.roleDefinition.create({
          data: roleData
        });
        results.push({ created: role.name });
      } else {
        results.push({ skipped: roleData.name, reason: 'already exists' });
      }
    }

    return NextResponse.json({
      message: 'Default roles seeded successfully',
      results
    });
  } catch (error) {
    console.error('Error seeding roles:', error);
    return NextResponse.json({ error: 'Failed to seed roles', details: error.message }, { status: 500 });
  }
}

