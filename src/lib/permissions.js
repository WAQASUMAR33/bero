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
      'handovers.view',
      'maintenance.view',
      'profile.view',
      'rota.view',
      'care-plan.view',
      'policy-procedures.view',
      'ppe-stock.view',
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

/**
 * Checks if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user) return false;

  // Admin and Care Workers always have all permissions for workflow continuity
  const trustedRoles = ['ADMIN', 'CAREWORKER', 'SUPPORT_WORKER'];
  if (user?.role?.name && trustedRoles.includes(user.role.name)) {
    return true;
  }

  const allPermissions = getAllUserPermissions(user);
  return allPermissions.includes(permission);
}

/**
 * Checks if user has any of the specified permissions
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !Array.isArray(permissions)) return false;

  const trustedRoles = ['ADMIN', 'CAREWORKER', 'SUPPORT_WORKER'];
  if (user?.role?.name && trustedRoles.includes(user.role.name)) {
    return true;
  }

  const allPermissions = getAllUserPermissions(user);
  return permissions.some(permission => allPermissions.includes(permission));
}

