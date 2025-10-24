'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function RegionManagementPage() {
  const [user, setUser] = useState(null);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    code: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'success' });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchRegions();
    } else {
      router.push('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRegions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/regions');
      const result = await response.json();
      
      if (result.success) {
        setRegions(result.data);
        if (result.message && result.message.includes('Database connection failed')) {
          showNotification('Database connection issue - showing cached data', 'warning');
        }
      } else {
        showNotification(`Failed to fetch regions: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      showNotification('Error fetching regions - check your connection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRegion = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          code: formData.code
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setRegions(prev => [result.data, ...prev]);
        setShowAddModal(false);
        resetForm();
        showNotification('Region added successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding region:', error);
      showNotification('Error adding region. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRegion = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/regions/${selectedRegion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          code: formData.code
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setRegions(prev => prev.map(region => 
          region.id === selectedRegion.id ? result.data : region
        ));
        setShowEditModal(false);
        resetForm();
        showNotification('Region updated successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating region:', error);
      showNotification('Error updating region. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (region) => {
    setRegionToDelete(region);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!regionToDelete) return;

    try {
      const response = await fetch(`/api/regions/${regionToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setRegions(prev => prev.filter(region => region.id !== regionToDelete.id));
        showNotification('Region deleted successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting region:', error);
      showNotification('Error deleting region. Please try again.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setRegionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRegionToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: ''
    });
    setSelectedRegion(null);
  };

  const openEditModal = (region) => {
    setSelectedRegion(region);
    setFormData({
      title: region.title,
      code: region.code
    });
    setShowEditModal(true);
  };

  const filteredRegions = regions.filter(region =>
    region.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRegions: regions.length,
    totalUsers: regions.reduce((sum, region) => sum + (region.totalUsers || 0), 0),
    activeUsers: regions.reduce((sum, region) => sum + (region.activeUsers || 0), 0),
    avgUsersPerRegion: regions.length > 0 ? Math.round(regions.reduce((sum, region) => sum + (region.totalUsers || 0), 0) / regions.length) : 0
  };

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
                  <p className="text-gray-600">Loading regions...</p>
                </div>
              </div>
            ) : (
              <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Region Management</h1>
                  <p className="text-gray-600 mt-1">Manage regions and their associated users</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Region
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Regions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRegions}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Users/Region</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgUsersPerRegion}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search regions by title or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Regions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Region Details</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Code</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Users</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRegions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-lg font-medium mb-2">No regions found</p>
                            <p className="text-sm">Get started by adding your first region</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRegions.map((region) => (
                        <tr key={region.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{region.title}</p>
                              <p className="text-sm text-gray-500">ID: {region.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {region.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">{region.totalUsers}</p>
                                <p className="text-xs text-gray-500">Total</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-green-600">{region.activeUsers}</p>
                                <p className="text-xs text-gray-500">Active</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {new Date(region.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(region.createdAt).toLocaleTimeString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(region)}
                                className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 hover:shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(region)}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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

          {/* Add Region Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 scale-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Add New Region</h3>
                      <p className="text-sm text-gray-600 mt-1">Create a new region with unique details</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleAddRegion} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Region Title</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="Enter region title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Region Code</label>
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="Enter region code"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Region'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Region Modal */}
          {showEditModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 scale-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Edit Region</h3>
                      <p className="text-sm text-gray-600 mt-1">Update region information</p>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleEditRegion} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Region Title</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="Enter region title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Region Code</label>
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                          placeholder="Enter region code"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Region'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Region
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{regionToDelete?.title}&quot;</span>? 
                This action cannot be undone.
                {regionToDelete?.totalUsers > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This region has {regionToDelete.totalUsers} user(s) and cannot be deleted.
                  </span>
                )}
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
                  disabled={regionToDelete?.totalUsers > 0}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Component */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}