'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import FileUpload from '../components/FileUpload';

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
        fetchPolicies(); // Refresh policies to update lastReviewed
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
        fetchPolicies(); // Refresh policies to update signature count
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
    // This would typically send notifications/emails to staff
    // For now, we'll just show a notification
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role?.name === 'ADMIN' || user.role?.displayName === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading policies...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy and Procedures</h1>
                    <p className="text-gray-600">Manage policies and track staff signoffs</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create New Policy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Policies List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Policy Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Review In</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Signoffs</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Reviewed</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated At</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated By</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {policies.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                            No policies found. {isAdmin && 'Create your first policy to get started.'}
                          </td>
                        </tr>
                      ) : (
                        policies.map((policy) => (
                          <tr key={policy.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-[#224fa6]" onClick={() => handleOpenFile(policy)}>
                                {policy.name}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900 cursor-pointer hover:text-[#224fa6]" onClick={() => handleOpenFile(policy)}>
                                {policy.fileName}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {policy.reviewIn ? `${policy.reviewIn} days` : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <button
                                onClick={() => handleViewSignatures(policy)}
                                className="text-sm font-medium text-[#224fa6] hover:text-[#3270e9] hover:underline"
                              >
                                {policy.signedCount || 0} / {policy.totalStaffCount || 0}
                              </button>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(policy.lastReviewed)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(policy.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(policy.updatedAt)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {policy.createdBy?.firstName} {policy.createdBy?.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {policy.updatedBy?.firstName} {policy.updatedBy?.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleViewHistory(policy)}
                                  className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                  title="View History"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReviewPrivacy(policy)}
                                  className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                  title="Review Privacy"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleSendSignoff(policy)}
                                    className="p-2 text-purple-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                    title="Send Signoff"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSignPolicy(policy)}
                                  className="px-3 py-1 text-sm bg-[#224fa6] text-white rounded-lg hover:bg-[#3270e9] transition-all duration-200"
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


                {/* Mobile Card View */}
                <div className="md:hidden">
                  {policies.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No policies found. {isAdmin && 'Create your first policy to get started.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {policies.map((policy) => (
                        <div key={policy.id} className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3
                                className="text-sm font-bold text-gray-900 cursor-pointer hover:text-[#224fa6]"
                                onClick={() => handleOpenFile(policy)}
                              >
                                {policy.name}
                              </h3>
                              <p
                                className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-[#224fa6]"
                                onClick={() => handleOpenFile(policy)}
                              >
                                {policy.fileName}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {policy.signedCount || 0}/{policy.totalStaffCount || 0} Signed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Review In:</span> {policy.reviewIn ? `${policy.reviewIn} days` : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Last Reviewed:</span> {formatDate(policy.lastReviewed).split(',')[0]}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {formatDate(policy.createdAt).split(',')[0]}
                            </div>
                            <div>
                              <span className="font-medium">By:</span> {policy.createdBy?.firstName} {policy.createdBy?.lastName}
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100 mt-2">
                            <button
                              onClick={() => handleViewHistory(policy)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View History"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReviewPrivacy(policy)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Review Privacy"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleSendSignoff(policy)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Send Signoff"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleSignPolicy(policy)}
                              className="px-4 py-1.5 text-xs font-medium bg-[#224fa6] text-white rounded-lg hover:bg-[#3270e9]"
                            >
                              Sign
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

          {/* Add Policy Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Create New Policy</h3>
                      <p className="text-sm text-gray-600 mt-1">Add a new policy document</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleAddPolicy} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Enter policy name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">File Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fileName}
                        onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Enter file name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">File Upload</label>
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
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✓ File uploaded: <a href={formData.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{formData.fileUrl}</a>
                          </p>
                        </div>
                      )}
                      <input
                        type="text"
                        value={formData.fileUrl || ''}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Or enter file URL manually"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Review In (days)</label>
                      <input
                        type="number"
                        value={formData.reviewIn}
                        onChange={(e) => setFormData({ ...formData, reviewIn: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="e.g., 30, 90, 365"
                        min="1"
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          resetForm();
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Policy'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* History Modal */}
          {showHistoryModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Policy History</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedPolicy.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowHistoryModal(false);
                        setSelectedPolicy(null);
                        setPolicyHistory([]);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {policyHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No history available</p>
                    ) : (
                      policyHistory.map((item, index) => (
                        <div key={index} className="border-l-4 border-[#224fa6] pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'CREATED' ? 'bg-green-100 text-green-800' :
                                  item.type === 'UPDATED' ? 'bg-blue-100 text-blue-800' :
                                    item.type === 'SIGNED' ? 'bg-purple-100 text-purple-800' :
                                      'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {item.type}
                                </span>
                                <span className="text-sm font-medium text-gray-900">{item.description}</span>
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                By: {item.user.firstName} {item.user.lastName} ({item.user.email})
                              </div>
                              {item.reviewText && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                  {item.reviewText}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 ml-4">
                              {formatHistoryDate(item.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {showReviewModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Review Policy</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedPolicy.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedPolicy(null);
                        setReviewFormData({ reviewText: '' });
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Review *</label>
                      <textarea
                        required
                        value={reviewFormData.reviewText}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, reviewText: e.target.value })}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="Enter your review of the policy..."
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewModal(false);
                          setSelectedPolicy(null);
                          setReviewFormData({ reviewText: '' });
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Signatures Modal */}
          {showSignaturesModal && selectedPolicy && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Policy Signatures</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedPolicy.name} - {selectedPolicy.signedCount || 0} of {selectedPolicy.totalStaffCount || 0} staff signed
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowSignaturesModal(false);
                        setSelectedPolicy(null);
                        setPolicySignatures([]);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {policySignatures.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No signatures yet</p>
                    ) : (
                      policySignatures.map((signature) => (
                        <div key={signature.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {signature.user.firstName} {signature.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{signature.user.email}</div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatHistoryDate(signature.signedAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })}
          />
        </main>
      </div>
    </div >
  );
}

