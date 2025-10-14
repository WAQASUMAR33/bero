'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function RoleManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  });

  const allPermissions = [
    { key: 'dashboard.view', label: 'View Dashboard', category: 'General' },
    { key: 'users.manage', label: 'Manage Users', category: 'User Management' },
    { key: 'staff.manage', label: 'Manage Staff', category: 'User Management' },
    { key: 'service-users.manage', label: 'Manage Service Users', category: 'Service' },
    { key: 'shifts.manage', label: 'Manage Shifts', category: 'Operations' },
    { key: 'daily-tasks.manage', label: 'Manage Daily Tasks', category: 'Operations' },
    { key: 'documents.manage', label: 'Manage Documents', category: 'Documents' },
    { key: 'regions.manage', label: 'Manage Regions', category: 'Settings' },
    { key: 'finance.manage', label: 'Manage Finance', category: 'Finance' },
    { key: 'reports.view', label: 'View Reports', category: 'Reports' },
    { key: 'settings.manage', label: 'Manage Settings', category: 'Settings' },
    { key: 'roles.manage', label: 'Manage Roles', category: 'Security' },
    { key: 'audit.view', label: 'View Audit Logs', category: 'Security' },
    { key: 'calendar.manage', label: 'Manage Calendar', category: 'General' },
    { key: 'clock-in-out.manage', label: 'Clock In/Out', category: 'Operations' },
    { key: 'cqc-inspection.manage', label: 'CQC Inspection', category: 'Compliance' },
    { key: 'quality-assurance.manage', label: 'Quality Assurance', category: 'Compliance' },
    { key: 'holidays.manage', label: 'Manage Holidays', category: 'HR' },
    { key: 'handover.manage', label: 'Handover', category: 'Operations' },
    { key: 'maintenance.manage', label: 'Maintenance', category: 'Operations' },
    { key: 'agenda.manage', label: 'Agenda', category: 'General' },
    { key: 'setup.manage', label: 'Setup', category: 'Settings' },
    { key: 'incidents.manage', label: 'Manage Incidents', category: 'Compliance' },
    { key: 'temperature-monitoring.manage', label: 'Temperature Monitoring', category: 'Compliance' },
    { key: 'well-being.manage', label: 'Well-being', category: 'Service' }
  ];

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'success' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchRoles();
  }, [router]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showNotification('Error fetching roles. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchRoles();
        showNotification('Role created successfully!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error creating role. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding role:', error);
      showNotification('Error creating role. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchRoles();
        showNotification('Role updated successfully!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error updating role. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification('Error updating role. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchRoles();
        showNotification('Role deleted successfully!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error deleting role. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showNotification('Error deleting role. Please try again.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
  };

  const handleEditClick = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? role.permissions : []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
    setSelectedRole(null);
  };

  const togglePermission = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }));
  };

  const toggleCategoryPermissions = (category) => {
    const categoryPerms = permissionsByCategory[category].map(p => p.key);
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !categoryPerms.includes(p))
        : [...new Set([...prev.permissions, ...categoryPerms])]
    }));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading roles...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
                      <p className="text-gray-600">Create and manage user roles with custom permissions</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Role</span>
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Roles</p>
                        <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">System Roles</p>
                        <p className="text-2xl font-bold text-gray-900">{roles.filter(r => r.isSystem).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                        <p className="text-2xl font-bold text-gray-900">{roles.filter(r => !r.isSystem).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Permissions</p>
                        <p className="text-2xl font-bold text-gray-900">{allPermissions.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                    />
                  </div>
                </div>

                {/* Roles Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permissions
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Users
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRoles.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              No roles found
                            </td>
                          </tr>
                        ) : (
                          filteredRoles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{role.displayName}</div>
                                    <div className="text-sm text-gray-500">{role.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{role.description || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{role._count?.users || 0}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {role.isSystem ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    System
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Custom
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => handleEditClick(role)}
                                  disabled={role.isSystem}
                                  className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(role)}
                                  disabled={role.isSystem}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add Role Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Add New Role</h3>
                      <p className="text-sm text-gray-600 mt-1">Create a new role with custom permissions</p>
                    </div>
                    <button
                      onClick={() => { setShowAddModal(false); resetForm(); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleAddRole} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                          placeholder="e.g., NURSE"
                        />
                        <p className="mt-1 text-xs text-gray-500">Will be converted to uppercase</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                          placeholder="e.g., Nurse"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="Brief description of this role..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Permissions
                      </label>
                      <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => (
                          <div key={category} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`category-${category}`}
                                checked={perms.every(p => formData.permissions.includes(p.key))}
                                onChange={() => toggleCategoryPermissions(category)}
                                className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded"
                              />
                              <label htmlFor={`category-${category}`} className="ml-2 text-sm font-semibold text-gray-900">
                                {category}
                              </label>
                            </div>
                            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {perms.map((perm) => (
                                <div key={perm.key} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={perm.key}
                                    checked={formData.permissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                    className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded"
                                  />
                                  <label htmlFor={perm.key} className="ml-2 text-sm text-gray-700">
                                    {perm.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowAddModal(false); resetForm(); }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Role'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Role Modal */}
          {showEditModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Edit Role</h3>
                      <p className="text-sm text-gray-600 mt-1">Update role information and permissions</p>
                    </div>
                    <button
                      onClick={() => { setShowEditModal(false); resetForm(); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleEditRole} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                          placeholder="e.g., NURSE"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                          placeholder="e.g., Nurse"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all duration-200 text-gray-900"
                        placeholder="Brief description of this role..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Permissions
                      </label>
                      <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => (
                          <div key={category} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`edit-category-${category}`}
                                checked={perms.every(p => formData.permissions.includes(p.key))}
                                onChange={() => toggleCategoryPermissions(category)}
                                className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded"
                              />
                              <label htmlFor={`edit-category-${category}`} className="ml-2 text-sm font-semibold text-gray-900">
                                {category}
                              </label>
                            </div>
                            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {perms.map((perm) => (
                                <div key={perm.key} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`edit-${perm.key}`}
                                    checked={formData.permissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                    className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded"
                                  />
                                  <label htmlFor={`edit-${perm.key}`} className="ml-2 text-sm text-gray-700">
                                    {perm.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowEditModal(false); resetForm(); }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Role'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Delete Role
                </h3>
                
                <p className="text-sm text-gray-600 text-center mb-6">
                  Are you sure you want to delete &quot;{roleToDelete?.displayName}&quot;? 
                  This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Notification 
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}

