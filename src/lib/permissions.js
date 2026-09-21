/**
 * Permission utility functions
 * Handles permission checking with role-level and user-level permissions,
 * and manages permission inheritance (e.g., manage implies read)
 */

/**
 * Expands permissions to include implied permissions
 * For example: shifts.manage implies shifts.read, shifts.view, etc.
 */
export function expandPermissions(permissions) {
  const expanded = new Set(permissions);

  permissions.forEach(permission => {
    // If user has manage permission, they also have read, view, and update
    if (permission.endsWith('.manage')) {
      const base = permission.replace('.manage', '');
      expanded.add(`${base}.read`);
      expanded.add(`${base}.view`);
      expanded.add(`${base}.update`);
      expanded.add(`${base}.create`);
      expanded.add(`${base}.delete`);
    }

    // If user has create/update/delete, they also have read
    if (permission.endsWith('.create') || permission.endsWith('.update') || permission.endsWith('.delete')) {
      const base = permission.replace(/\.(create|update|delete)$/, '');
      expanded.add(`${base}.read`);
      expanded.add(`${base}.view`);
    }

    // If user has read, they also have view
    if (permission.endsWith('.read')) {
      const base = permission.replace('.read', '');
      expanded.add(`${base}.view`);
    }
  });

  return Array.from(expanded);
}

/**
 * Gets all permissions for a user (role + user-level)
 */
export function getAllUserPermissions(user) {
  const userPermissions = user?.permissions?.map(p => p.key) || [];
  let rolePermissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : [];

  // FORCE DEFAULT VIEW PERMISSIONS
  // Ensure "all other users in the admin panel can view every thing"
  if (user?.role?.name !== 'ADMIN') {
    const defaultViewPermissions = [
      'users.view',
      'service_seekers.view',
      'shifts.view',
      'care_tasks.view',
      'holidays.view',
      'policies.view',
      'finance.view',
      'reports.view',
      'settings.view',
      'audit.view',
      'calendar.view',
      'clock-in-out.view',
      'cqc-inspection.view',
      'quality-assurance.view',
      'enquiries.view',
      'governance.view',
      'handovers.view',
      'maintenance.view',
      'profile.view',
      'rota.view',
      'care-plan.view',
      'policy-procedures.view',
      'notifications.view',
      'incidents.view',
      'documents.view',
      'regions.view',
      'roles.view',
      'daily-tasks.view',
      'agenda.view',
      'setup.view'
    ];

    // Add default view permissions if they don't exist
    rolePermissions = [...rolePermissions, ...defaultViewPermissions];
  }

  // Combine and expand permissions
  const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];
  return expandPermissions(allPermissions);
}

export const MANAGER_ROLES = [
  'ADMIN',
  'DIRECTOR',
  'HR',
  'REGISTER_MANAGER',
  'DEPUTY_MANAGER',
  'BUSINESS_DEVELOPMENT_MANAGER',
  'SERVICE_LEAD'
];

/**
 * Checks if a user has managerial privileges
 */
export function isManager(user) {
  if (!user) return false;
  if (user?.role?.name && MANAGER_ROLES.includes(user.role.name)) {
    return true;
  }
  const allPermissions = getAllUserPermissions(user);
  return (
    allPermissions.includes('users.manage') ||
    allPermissions.includes('staff.manage') ||
    allPermissions.includes('users.view_all')
  );
}

/**
 * Determines whether a user can access a specific staff member's file:
 * Managers can access all; staff can only access their own.
 */
export function canAccessStaffMember(currentUser, targetUserId) {
  if (!currentUser) return false;
  if (isManager(currentUser)) return true;
  const currentId = currentUser.id || currentUser.userId;
  return Number(currentId) === Number(targetUserId);
}

/**
 * Checks if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user) return false;

  // Super Admin always has full access
  if (user?.role?.name === 'ADMIN') {
    return true;
  }

  // Managerial staff permissions
  const managerOnlyPermissions = [
    'users.create',
    'users.update',
    'users.delete',
    'users.manage',
    'staff.manage',
    'roles.manage'
  ];

  if (managerOnlyPermissions.includes(permission)) {
    return isManager(user);
  }

  // Care Workers & Support Workers have workflow operational permissions for care tasks & shifts
  const operationalRoles = ['CAREWORKER', 'SUPPORT_WORKER'];
  if (user?.role?.name && operationalRoles.includes(user.role.name)) {
    if (!permission.startsWith('users.') && !permission.startsWith('roles.') && !permission.startsWith('staff.')) {
      return true;
    }
  }

  const allPermissions = getAllUserPermissions(user);
  return allPermissions.includes(permission);
}

/**
 * Checks if user has any of the specified permissions
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !Array.isArray(permissions)) return false;

  if (user?.role?.name === 'ADMIN') {
    return true;
  }

  return permissions.some(permission => hasPermission(user, permission));
}

