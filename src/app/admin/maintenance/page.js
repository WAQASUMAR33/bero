'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function MaintenancePage() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Filters
  const [filterIssueType, setFilterIssueType] = useState('all');
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const issueTypes = [
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'HEALTH_AND_SAFETY', label: 'Health and Safety' },
    { value: 'WELFARE', label: 'Welfare' },
    { value: 'OTHER', label: 'Other' }
  ];

  const repeatOptions = [
    { value: 'NO', label: 'No' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchIssues();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/maintenance-issues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setIssues(result.data || []);
        // Show warning if database migration is needed
        if (result.message && result.message.includes('migrate')) {
          showNotification('Database migration required. Please run: npx prisma migrate dev', 'error');
        }
      } else {
        console.error('Error fetching issues:', result.error);
        setIssues([]);
        // Show user-friendly error message
        if (result.details && result.details.includes('migrate')) {
          showNotification('Database migration required. Please run: npx prisma migrate dev', 'error');
        } else {
          showNotification(result.error || 'Failed to fetch maintenance issues', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      showNotification('Failed to fetch maintenance issues. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maintenance-issues/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setIssues(prev => prev.filter(i => i.id !== id));
        showNotification('Issue deleted successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      showNotification('Error deleting issue. Please try again.', 'error');
    }
  };

  const getIssueTypeLabel = (type) => {
    return issueTypes.find(t => t.value === type)?.label || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Apply filters and search
  const filteredIssues = issues.filter((issue) => {
    if (filterIssueType !== 'all' && issue.issueType !== filterIssueType) {
      return false;
    }

    if (filterCompleted !== 'all') {
      const completedValue = issue.completed || 'NO';
      if (filterCompleted === 'YES' && completedValue !== 'YES') return false;
      if (filterCompleted === 'NO' && completedValue !== 'YES') return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const forField = (issue.for || '').toLowerCase();
      const issueDescription = (issue.issue || '').toLowerCase();
      const typeLabel = getIssueTypeLabel(issue.issueType).toLowerCase();

      if (
        !forField.includes(q) &&
        !issueDescription.includes(q) &&
        !typeLabel.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  if (!user) {
    return null;
  }

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
                <p className="text-gray-600">Loading maintenance log...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Log</h1>
                    <p className="text-gray-600">Report and track system maintenance issues</p>
                  </div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Report Issue</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by issue type, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Issue Type filter */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Type</label>
                    <select
                      value={filterIssueType}
                      onChange={(e) => setFilterIssueType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All Types</option>
                      {issueTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Completed filter */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Completed</label>
                    <select
                      value={filterCompleted}
                      onChange={(e) => setFilterCompleted(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All</option>
                      <option value="YES">Yes</option>
                      <option value="NO">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Maintenance Issues</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">For</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Repeats</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completed</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                            No issues found. Click &quot;Report Issue&quot; to create one.
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {getIssueTypeLabel(issue.issueType)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {issue.for || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm text-gray-900 max-w-md truncate">
                                {issue.issue || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {repeatOptions.find(r => r.value === issue.repeats)?.label || issue.repeats || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(issue.issueDate)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                issue.completed === 'YES' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {issue.completed === 'YES' ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {issue.createdBy 
                                  ? `${issue.createdBy.firstName || ''} ${issue.createdBy.lastName || ''}`.trim() || '-'
                                  : '-'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {issue.createdAt ? formatDate(issue.createdAt) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleDelete(issue.id)}
                                  className="p-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Report Issue Modal */}
          {showReportModal && (
            <ReportIssueModal
              issueTypes={issueTypes}
              repeatOptions={repeatOptions}
              user={user}
              onClose={() => setShowReportModal(false)}
              onSave={async (formData) => {
                try {
                  setIsSubmitting(true);
                  const token = localStorage.getItem('token');
                  // Handle 'for' field (reserved word in JavaScript)
                  const requestBody = {
                    ...formData,
                    for: formData.for
                  };
                  const response = await fetch('/api/maintenance-issues', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    showNotification('Issue reported successfully!', 'success');
                    setShowReportModal(false);
                    fetchIssues();
                  } else {
                    showNotification(`Error: ${result.error}`, 'error');
                  }
                } catch (error) {
                  console.error('Error saving issue:', error);
                  showNotification('Error saving issue. Please try again.', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              isSubmitting={isSubmitting}
            />
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })}
          />
        </main>
      </div>
    </div>
  );
}

// Report Issue Modal Component
function ReportIssueModal({ issueTypes, repeatOptions, user, onClose, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    issueType: '',
    for: '',
    issue: '',
    repeats: 'NO',
    issueDate: new Date().toISOString().split('T')[0],
    completed: 'NO'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.issueType) {
      newErrors.issueType = 'Issue Type is required';
    }
    if (!formData.issue) {
      newErrors.issue = 'Issue description is required';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Report Issue</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.issueType}
              onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                errors.issueType ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Please Select</option>
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.issueType && (
              <p className="mt-1 text-sm text-red-500">{errors.issueType}</p>
            )}
          </div>

          {/* For */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">For</label>
            <input
              type="text"
              value={formData.for}
              onChange={(e) => setFormData({ ...formData, for: e.target.value })}
              placeholder="Enter details"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
            />
          </div>

          {/* Issue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="Provide a description of the issue here"
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200 resize-y ${
                errors.issue ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.issue && (
              <p className="mt-1 text-sm text-red-500">{errors.issue}</p>
            )}
          </div>

          {/* Repeats */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Repeats</label>
            <select
              value={formData.repeats}
              onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
            >
              {repeatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                  errors.issueDate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {errors.issueDate && (
              <p className="mt-1 text-sm text-red-500">{errors.issueDate}</p>
            )}
          </div>

          {/* Completed */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Completed</label>
            <select
              value={formData.completed}
              onChange={(e) => setFormData({ ...formData, completed: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photos</label>
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-not-allowed">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.26A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.26A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Photo upload (Pending)</p>
              </div>
            </div>
          </div>

          {/* Created By and Created At (Read-only) */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Created By</label>
              <input
                type="text"
                value={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Created At</label>
              <input
                type="text"
                value={new Date().toLocaleString('en-GB')}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

