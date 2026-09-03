'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import FileUpload from '../components/FileUpload';
import { hasPermission } from '@/lib/permissions';

export default function PolicyProceduresPage() {
  const [user, setUser] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSignaturesModal, setShowSignaturesModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [policySignatures, setPolicySignatures] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReview, setFilterReview] = useState('ALL');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    fileName: '',
    fileUrl: '',
    reviewIn: ''
  });

  const [reviewFormData, setReviewFormData] = useState({
    reviewText: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      fetchPolicies();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/policies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setPolicies(result.data);
      } else {
        console.error('Error fetching policies:', result.error);
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          fileName: formData.fileName,
          fileUrl: formData.fileUrl || null,
          reviewIn: formData.reviewIn ? parseInt(formData.reviewIn) : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPolicies(prev => [result.data, ...prev]);
        setShowAddModal(false);
        resetForm();
        showNotification('Policy created successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      showNotification('Error creating policy. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = async (policy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${policy.id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setPolicyHistory(result.data);
        setSelectedPolicy(policy);
        setShowHistoryModal(true);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching policy history:', error);
      showNotification('Error fetching policy history. Please try again.', 'error');
    }
  };

  const handleReviewPrivacy = async (policy) => {
    setSelectedPolicy(policy);
    setReviewFormData({ reviewText: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${selectedPolicy.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewText: reviewFormData.reviewText
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowReviewModal(false);
        setReviewFormData({ reviewText: '' });
        setSelectedPolicy(null);
        fetchPolicies();
        showNotification('Review submitted successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Error submitting review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignPolicy = async (policy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${policy.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const result = await response.json();

      if (result.success) {
        fetchPolicies();
        showNotification('Policy signed successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error signing policy:', error);
      showNotification('Error signing policy. Please try again.', 'error');
    }
  };

  const handleViewSignatures = async (policy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${policy.id}/signatures`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (result.success) {
        setPolicySignatures(result.data.signatures);
        setSelectedPolicy({
          ...policy,
          signedCount: result.data.signedCount,
          totalStaffCount: result.data.totalStaffCount
        });
        setShowSignaturesModal(true);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      showNotification('Error fetching signatures. Please try again.', 'error');
    }
  };

  const handleSendSignoff = async (policy) => {
    showNotification(`Signoff requests will be sent to all staff for policy: ${policy.name}`, 'success');
  };

  const handleOpenFile = (policy) => {
    if (policy.fileUrl) {
      window.open(policy.fileUrl, '_blank');
    } else {
      showNotification('File URL not available yet. File upload system is pending.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fileName: '',
      fileUrl: '',
      reviewIn: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHistoryDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = policies.length;
    const totalSignoffs = policies.reduce((acc, p) => acc + (p.signedCount || 0), 0);
    const totalStaffRequired = policies.reduce((acc, p) => acc + (p.totalStaffCount || 0), 0);
    const signoffRate = totalStaffRequired > 0 ? Math.round((totalSignoffs / totalStaffRequired) * 100) : 0;
    const withReview = policies.filter(p => p.reviewIn && p.reviewIn > 0).length;
    return { total, totalSignoffs, signoffRate, withReview };
  }, [policies]);

  // Filtered policies based on search and status
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        policy.name?.toLowerCase().includes(q) ||
        policy.fileName?.toLowerCase().includes(q) ||
        policy.createdBy?.firstName?.toLowerCase().includes(q) ||
        policy.createdBy?.lastName?.toLowerCase().includes(q)
      );

      if (!matchesSearch) return false;

      if (filterReview === 'NEED_REVIEW') {
        return Boolean(policy.reviewIn && policy.reviewIn > 0);
      }
      if (filterReview === 'COMPLETED') {
        return policy.totalStaffCount > 0 && policy.signedCount >= policy.totalStaffCount;
      }
      return true;
    });
  }, [policies, searchTerm, filterReview]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role?.name === 'ADMIN' || user.role?.displayName === 'Admin' || hasPermission(user, 'policies.manage') || hasPermission(user, 'policies.create');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-w-0">
        <Header user={user} />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-auto min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">Loading policies...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Responsive Header */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Policy and Procedures</h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage policies, scheduled review cycles, and track staff signoffs</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full sm:w-auto justify-center bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base font-medium shadow-sm hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create New Policy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Responsive Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Total Policies</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Staff Signoffs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSignoffs}</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-2.5 sm:p-3 bg-green-50 text-green-600 rounded-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Signoff Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.signoffRate}%</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
                  <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Review Cycle</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.withReview}</p>
                  </div>
                </div>
              </div>

              {/* Responsive Search and Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search policies by name, file, or author..."
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      value={filterReview}
                      onChange={(e) => setFilterReview(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900 transition-all"
                    >
                      <option value="ALL">All Policies</option>
                      <option value="NEED_REVIEW">Scheduled Review</option>
                      <option value="COMPLETED">Fully Signed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Policies Container */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View (lg and up) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Policy Name</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Review In</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Signoffs</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Reviewed</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredPolicies.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-base font-medium text-gray-900">No policies found</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {searchTerm ? 'Try adjusting your search query or filter.' : (isAdmin ? 'Create your first policy to get started.' : '')}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPolicies.map((policy) => (
                          <tr key={policy.id} className="hover:bg-gray-50/80 transition-colors duration-150">
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div
                                className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-[#224fa6] flex items-center space-x-2"
                                onClick={() => handleOpenFile(policy)}
                                title="Open document"
                              >
                                <svg className="w-4 h-4 text-[#224fa6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{policy.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div
                                className="text-xs text-gray-500 cursor-pointer hover:text-[#224fa6] font-mono truncate max-w-[180px]"
                                onClick={() => handleOpenFile(policy)}
                                title={policy.fileName}
                              >
                                {policy.fileName}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium bg-gray-100 text-gray-700">
                                {policy.reviewIn ? `${policy.reviewIn} days` : 'None'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewSignatures(policy)}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-[#224fa6] hover:bg-blue-100 transition-colors"
                                title="View staff signatures"
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {policy.signedCount || 0} / {policy.totalStaffCount || 0}
                              </button>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                              {formatDate(policy.lastReviewed)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                              {formatDate(policy.createdAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                              {policy.createdBy ? `${policy.createdBy.firstName} ${policy.createdBy.lastName}` : '-'}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleViewHistory(policy)}
                                  className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-150"
                                  title="View History"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReviewPrivacy(policy)}
                                  className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-150"
                                  title="Review Policy"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleSendSignoff(policy)}
                                    className="p-1.5 text-purple-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-150"
                                    title="Send Signoff Requests"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSignPolicy(policy)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-[#224fa6] text-white rounded-lg hover:bg-[#3270e9] transition-all duration-150 shadow-sm"
                                  title="Sign Policy"
                                >
                                  Sign
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Card View (under lg screen) */}
                <div className="lg:hidden">
                  {filteredPolicies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-base font-medium text-gray-900">No policies found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchTerm ? 'Try adjusting your search query.' : (isAdmin ? 'Create your first policy to get started.' : '')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredPolicies.map((policy) => (
                        <div key={policy.id} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/60 transition-colors">
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-base font-semibold text-gray-900 cursor-pointer hover:text-[#224fa6] flex items-center space-x-2"
                                onClick={() => handleOpenFile(policy)}
                              >
                                <svg className="w-4 h-4 text-[#224fa6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{policy.name}</span>
                              </div>
                              <p
                                className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-[#224fa6] font-mono truncate pl-6"
                                onClick={() => handleOpenFile(policy)}
                              >
                                {policy.fileName}
                              </p>
                            </div>
                            <div className="flex-shrink-0 pl-6 sm:pl-0">
                              <button
                                onClick={() => handleViewSignatures(policy)}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-[#224fa6] hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {policy.signedCount || 0}/{policy.totalStaffCount || 0} Signed
                              </button>
                            </div>
                          </div>

                          {/* Card Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                              <span className="font-semibold text-gray-500">Review In:</span>
                              <span className="font-medium text-gray-800">{policy.reviewIn ? `${policy.reviewIn} days` : 'None'}</span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                              <span className="font-semibold text-gray-500">Last Reviewed:</span>
                              <span className="font-medium text-gray-800">{formatDate(policy.lastReviewed)}</span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                              <span className="font-semibold text-gray-500">Created:</span>
                              <span className="font-medium text-gray-800">{formatDate(policy.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                              <span className="font-semibold text-gray-500">Author:</span>
                              <span className="font-medium text-gray-800 truncate">{policy.createdBy ? `${policy.createdBy.firstName} ${policy.createdBy.lastName}` : '-'}</span>
                            </div>
                          </div>

                          {/* Card Actions (responsive touch-friendly toolbar) */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleViewHistory(policy)}
                              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-1.5 transition-colors"
                              title="View History"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>History</span>
                            </button>

                            <button
                              onClick={() => handleReviewPrivacy(policy)}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex items-center space-x-1.5 transition-colors"
                              title="Review Policy"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Review</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleSendSignoff(policy)}
                                className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center space-x-1.5 transition-colors"
                                title="Send Signoff Requests"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Signoff</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleSignPolicy(policy)}
                              className="px-4 py-1.5 text-xs font-semibold bg-[#224fa6] text-white rounded-lg hover:bg-[#3270e9] transition-all shadow-sm"
                            >
                              Sign Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add Policy Modal - Fully Responsive */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Policy</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Upload and register a new compliance policy</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddPolicy} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Policy Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-sm transition-all"
                      placeholder="e.g. Health & Safety Policy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">File Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-sm transition-all"
                      placeholder="e.g. health-safety-v1.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Upload Document</label>
                    <FileUpload
                      accept="application/pdf,.pdf,.doc,.docx"
                      label="Choose File"
                      onUploadComplete={(fileUrl, fileName) => {
                        setFormData({
                          ...formData,
                          fileUrl: fileUrl,
                          fileName: fileName || formData.fileName
                        });
                        showNotification('File uploaded successfully!', 'success');
                      }}
                      onError={(error) => {
                        showNotification(`Upload failed: ${error}`, 'error');
                      }}
                      className="mb-2"
                    />
                    {formData.fileUrl && (
                      <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-xs text-green-800 break-all">
                          ✓ File uploaded: <a href={formData.fileUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{formData.fileUrl}</a>
                        </p>
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.fileUrl || ''}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="w-full mt-2 px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-sm transition-all"
                      placeholder="Or paste direct file URL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Review Interval (days)</label>
                    <input
                      type="number"
                      value={formData.reviewIn}
                      onChange={(e) => setFormData({ ...formData, reviewIn: e.target.value })}
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-sm transition-all"
                      placeholder="e.g. 30, 90, 180, 365"
                      min="1"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Policy'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* History Modal - Fully Responsive */}
          {showHistoryModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Policy Audit History</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{selectedPolicy.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      setSelectedPolicy(null);
                      setPolicyHistory([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                  {policyHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium text-sm">No history records found</p>
                    </div>
                  ) : (
                    policyHistory.map((item, index) => (
                      <div key={index} className="border-l-4 border-[#224fa6] bg-gray-50/70 p-3.5 sm:p-4 rounded-r-xl border border-l-0 border-gray-100 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              item.type === 'CREATED' ? 'bg-green-100 text-green-800' :
                              item.type === 'UPDATED' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'SIGNED' ? 'bg-purple-100 text-purple-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {item.type}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.description}</span>
                          </div>
                          <span className="text-xs text-gray-500 sm:text-right">
                            {formatHistoryDate(item.timestamp)}
                          </span>
                        </div>

                        <div className="text-xs text-gray-600">
                          By: <span className="font-medium text-gray-800">{item.user?.firstName} {item.user?.lastName}</span> ({item.user?.email})
                        </div>

                        {item.reviewText && (
                          <div className="mt-2 text-xs sm:text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            {item.reviewText}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      setSelectedPolicy(null);
                      setPolicyHistory([]);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal - Fully Responsive */}
          {showReviewModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Review Policy</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{selectedPolicy.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedPolicy(null);
                      setReviewFormData({ reviewText: '' });
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmitReview} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Review Notes & Feedback *</label>
                    <textarea
                      required
                      value={reviewFormData.reviewText}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, reviewText: e.target.value })}
                      rows={6}
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-sm transition-all resize-y"
                      placeholder="Detail any necessary revisions, compliance verification, or observations..."
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedPolicy(null);
                        setReviewFormData({ reviewText: '' });
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Signatures Modal - Fully Responsive */}
          {showSignaturesModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Staff Signatures</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                      {selectedPolicy.name} — <span className="font-semibold text-blue-600">{selectedPolicy.signedCount || 0}</span> of {selectedPolicy.totalStaffCount || 0} staff signed
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSignaturesModal(false);
                      setSelectedPolicy(null);
                      setPolicySignatures([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
                  {policySignatures.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="font-medium text-sm">No signatures recorded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Staff will appear here after acknowledging this policy.</p>
                    </div>
                  ) : (
                    policySignatures.map((signature) => (
                      <div key={signature.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {signature.user?.firstName?.[0]}{signature.user?.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                              {signature.user?.firstName} {signature.user?.lastName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{signature.user?.email}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center space-x-1 pl-12 sm:pl-0">
                          <svg className="w-3.5 h-3.5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Signed: {formatHistoryDate(signature.signedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      setShowSignaturesModal(false);
                      setSelectedPolicy(null);
                      setPolicySignatures([]);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        </main>
      </div>
    </div>
  );
}
