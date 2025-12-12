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
  const rolePermissions = Array.isArray(user?.role?.permissions) 
    ? user.role.permissions 
    : [];
  
  // Combine and expand permissions
  const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];
  return expandPermissions(allPermissions);
}

/**
 * Checks if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user?.role?.name === 'ADMIN') {
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
  
  if (user?.role?.name === 'ADMIN') {
    return true;
  }
  
  const allPermissions = getAllUserPermissions(user);
  return permissions.some(permission => allPermissions.includes(permission));
}

