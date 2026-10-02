'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

// Helper to parse extended metadata stored in photoUrls
function parseIssueMetadata(raw) {
  if (!raw) {
    return {
      priority: 'MEDIUM',
      status: 'PENDING',
      progressLogs: [],
      comments: [],
      completionDetails: null,
      photos: []
    };
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return {
        priority: 'MEDIUM',
        status: 'PENDING',
        progressLogs: [],
        comments: [],
        completionDetails: null,
        photos: parsed
      };
    }
    return {
      priority: parsed.priority || 'MEDIUM',
      status: parsed.status || (parsed.completionDetails ? 'COMPLETED' : 'PENDING'),
      progressLogs: Array.isArray(parsed.progressLogs) ? parsed.progressLogs : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      completionDetails: parsed.completionDetails || null,
      photos: Array.isArray(parsed.photos) ? parsed.photos : []
    };
  } catch (e) {
    return {
      priority: 'MEDIUM',
      status: 'PENDING',
      progressLogs: [],
      comments: [],
      completionDetails: null,
      photos: []
    };
  }
}

export default function MaintenancePage() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssueForView, setSelectedIssueForView] = useState(null);
  const [selectedIssueForEdit, setSelectedIssueForEdit] = useState(null);
  const [selectedIssueForComplete, setSelectedIssueForComplete] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Filters
  const [filterIssueType, setFilterIssueType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
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

  const priorityOptions = [
    { value: 'LOW', label: 'Low', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'MEDIUM', label: 'Medium', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'HIGH', label: 'High', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'URGENT', label: 'Urgent', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' }
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', badgeClass: 'bg-yellow-100 text-yellow-800' },
    { value: 'IN_PROGRESS', label: 'In Progress', badgeClass: 'bg-blue-100 text-blue-800' },
    { value: 'WAITING_PARTS', label: 'Waiting for Parts', badgeClass: 'bg-purple-100 text-purple-800' },
    { value: 'ON_HOLD', label: 'On Hold', badgeClass: 'bg-gray-100 text-gray-800' },
    { value: 'COMPLETED', label: 'Completed', badgeClass: 'bg-emerald-100 text-emerald-800' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3500);
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
      } else {
        console.error('Error fetching issues:', result.error);
        setIssues([]);
        showNotification(result.error || 'Failed to fetch maintenance issues', 'error');
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      showNotification('Failed to fetch maintenance issues. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIssue = async (id, updatePayload) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maintenance-issues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });
      const result = await response.json();

      if (result.success) {
        showNotification('Maintenance issue updated successfully!', 'success');
        await fetchIssues();

        // Update active modals with fresh data
        if (selectedIssueForView && selectedIssueForView.id === id) {
          setSelectedIssueForView(result.data);
        }
        if (selectedIssueForEdit && selectedIssueForEdit.id === id) {
          setSelectedIssueForEdit(null);
        }
        if (selectedIssueForComplete && selectedIssueForComplete.id === id) {
          setSelectedIssueForComplete(null);
        }
        return result.data;
      } else {
        showNotification(`Error: ${result.error}`, 'error');
        return null;
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      showNotification('Error updating issue. Please try again.', 'error');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maintenance-issues/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        setIssues((prev) => prev.filter((i) => i.id !== id));
        if (selectedIssueForView?.id === id) setSelectedIssueForView(null);
        showNotification('Issue deleted successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      showNotification('Error deleting issue. Please try again.', 'error');
    }
  };

  const handleReopenJob = async (issue) => {
    if (!confirm('Are you sure you want to reopen this completed job?')) return;

    const meta = parseIssueMetadata(issue.photoUrls);
    const updatedMeta = {
      ...meta,
      status: 'IN_PROGRESS',
      progressLogs: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Maintenance Team',
          status: 'IN_PROGRESS',
          notes: 'Job reopened for further inspection/rectification.',
          hoursSpent: '',
          partsUsed: ''
        },
        ...meta.progressLogs
      ]
    };

    await handleUpdateIssue(issue.id, {
      ...issue,
      completed: 'NO',
      photoUrls: updatedMeta
    });
  };

  const getIssueTypeLabel = (type) => {
    return issueTypes.find((t) => t.value === type)?.label || type;
  };

  const formatDate = (dateString, withTime = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (withTime) {
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Counts and statistics
  const activeCount = useMemo(() => issues.filter((i) => i.completed !== 'YES').length, [issues]);
  const completedCount = useMemo(() => issues.filter((i) => i.completed === 'YES').length, [issues]);
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    return issues.filter((i) => {
      if (i.completed !== 'YES') return false;
      const meta = parseIssueMetadata(i.photoUrls);
      const date = meta.completionDetails?.completedAt ? new Date(meta.completionDetails.completedAt) : new Date(i.updatedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [issues]);

  // Apply tab, search, and type filters
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Tab filter
      if (activeTab === 'active' && issue.completed === 'YES') return false;
      if (activeTab === 'completed' && issue.completed !== 'YES') return false;

      // Issue type filter
      if (filterIssueType !== 'all' && issue.issueType !== filterIssueType) {
        return false;
      }

      // Priority filter
      const meta = parseIssueMetadata(issue.photoUrls);
      if (filterPriority !== 'all' && meta.priority !== filterPriority) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const forField = (issue.for || '').toLowerCase();
        const issueDescription = (issue.issue || '').toLowerCase();
        const typeLabel = getIssueTypeLabel(issue.issueType).toLowerCase();
        const resolutionNotes = (meta.completionDetails?.resolutionNotes || '').toLowerCase();
        const resolvedBy = (meta.completionDetails?.completedBy || '').toLowerCase();

        if (
          !forField.includes(q) &&
          !issueDescription.includes(q) &&
          !typeLabel.includes(q) &&
          !resolutionNotes.includes(q) &&
          !resolvedBy.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [issues, activeTab, filterIssueType, filterPriority, searchTerm]);

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
                <p className="text-gray-600">Loading maintenance system...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Maintenance & Works</h1>
                    <p className="text-sm lg:text-base text-gray-600">Track issues, record work logs, and review completed maintenance history</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 ${
                    activeTab === 'active'
                      ? 'border-[#224fa6] text-[#224fa6] bg-blue-50/60'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Active Issues</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'active' ? 'bg-[#224fa6] text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {activeCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 ${
                    activeTab === 'completed'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Completed Jobs Log</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {completedCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 ${
                    activeTab === 'all'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>All Records</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {issues.length}
                  </span>
                </button>
              </div>

              {/* Completed Jobs Log KPI highlight bar (when on completed tab) */}
              {activeTab === 'completed' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Completed Jobs</p>
                      <h4 className="text-2xl font-bold text-gray-900">{completedCount}</h4>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed This Month</p>
                      <h4 className="text-2xl font-bold text-gray-900">{completedThisMonth}</h4>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending / Active</p>
                      <h4 className="text-2xl font-bold text-gray-900">{activeCount}</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters & Search */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Search */}
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Search</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder={activeTab === 'completed' ? "Search completed jobs, resolution notes, technician..." : "Search issue, location, equipment..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Issue Type filter */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Category</label>
                    <select
                      value={filterIssueType}
                      onChange={(e) => setFilterIssueType(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all"
                    >
                      <option value="all">All Categories</option>
                      {issueTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority filter */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all"
                    >
                      <option value="all">All Priorities</option>
                      {priorityOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Content Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 lg:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-gray-900">
                      {activeTab === 'active' && 'Active Maintenance Issues'}
                      {activeTab === 'completed' && 'Completed Jobs Archive & Log'}
                      {activeTab === 'all' && 'All Maintenance Records'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Showing {filteredIssues.length} {filteredIssues.length === 1 ? 'record' : 'records'}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Ref / Priority</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">For / Location</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Issue Description</th>
                        {activeTab === 'completed' ? (
                          <>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Completed Date</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Resolved By</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Resolution Summary</th>
                          </>
                        ) : (
                          <>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Issue Date</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Latest Progress</th>
                          </>
                        )}
                        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={activeTab === 'completed' ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                            <div className="max-w-sm mx-auto text-center">
                              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <p className="font-medium text-gray-800">No records found</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {activeTab === 'completed'
                                  ? 'No completed jobs match your filters.'
                                  : 'No active maintenance issues found. Click "Report Issue" to log a new job.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((issue) => {
                          const meta = parseIssueMetadata(issue.photoUrls);
                          const priorityObj = priorityOptions.find((p) => p.value === meta.priority) || priorityOptions[1];
                          const statusObj = statusOptions.find((s) => s.value === meta.status) || (issue.completed === 'YES' ? statusOptions[4] : statusOptions[0]);
                          const latestLog = meta.progressLogs && meta.progressLogs.length > 0 ? meta.progressLogs[0] : null;

                          return (
                            <tr key={issue.id} className="hover:bg-blue-50/30 transition-colors">
                              {/* Ref / Priority */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono font-bold text-gray-500">#{issue.id}</span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${priorityObj.badgeClass}`}>
                                    {priorityObj.label}
                                  </span>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-xs font-semibold text-gray-800">
                                  {getIssueTypeLabel(issue.issueType)}
                                </div>
                                {issue.repeats && issue.repeats !== 'NO' && (
                                  <span className="text-[10px] text-gray-500 flex items-center mt-0.5">
                                    <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Repeats: {issue.repeats}
                                  </span>
                                )}
                              </td>

                              {/* For / Location */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {issue.for || '-'}
                                </div>
                              </td>

                              {/* Issue Description */}
                              <td className="px-5 py-4">
                                <div className="text-sm text-gray-800 max-w-xs truncate" title={issue.issue}>
                                  {issue.issue || '-'}
                                </div>
                              </td>

                              {/* Conditional columns for Completed vs Active */}
                              {activeTab === 'completed' ? (
                                <>
                                  {/* Completed Date */}
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="text-xs font-medium text-emerald-800">
                                      {formatDate(meta.completionDetails?.completedAt || issue.updatedAt, true)}
                                    </div>
                                  </td>

                                  {/* Resolved By */}
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="text-xs text-gray-700 font-medium">
                                      {meta.completionDetails?.completedBy ||
                                        (issue.updatedBy ? `${issue.updatedBy.firstName || ''} ${issue.updatedBy.lastName || ''}`.trim() : 'Maintenance Staff')}
                                    </div>
                                  </td>

                                  {/* Resolution Summary */}
                                  <td className="px-5 py-4">
                                    <div className="text-xs text-gray-600 max-w-xs truncate" title={meta.completionDetails?.resolutionNotes || latestLog?.notes || 'Completed'}>
                                      {meta.completionDetails?.resolutionNotes || latestLog?.notes || 'Marked as completed.'}
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Status */}
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${statusObj.badgeClass}`}>
                                      {statusObj.label}
                                    </span>
                                  </td>

                                  {/* Issue Date */}
                                  <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="text-xs text-gray-600">
                                      {formatDate(issue.issueDate)}
                                    </div>
                                  </td>

                                  {/* Latest Progress */}
                                  <td className="px-5 py-4">
                                    {latestLog ? (
                                      <div className="text-xs max-w-xs">
                                        <p className="text-gray-800 font-medium truncate" title={latestLog.notes}>
                                          {latestLog.notes}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                          {formatDate(latestLog.timestamp, true)} • {latestLog.userName}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">No progress logs yet</span>
                                    )}
                                  </td>
                                </>
                              )}

                              {/* Actions Column */}
                              <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {/* View Button */}
                                  <button
                                    onClick={() => setSelectedIssueForView(issue)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                                    title="View full details and log progress"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-xs font-semibold pr-1">View</span>
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => setSelectedIssueForEdit(issue)}
                                    className="p-1.5 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                    title="Edit issue details"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>

                                  {/* Quick Complete Button (for active jobs) */}
                                  {issue.completed !== 'YES' ? (
                                    <button
                                      onClick={() => setSelectedIssueForComplete(issue)}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                      title="Mark job as completed"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                  ) : (
                                    /* Reopen button for completed jobs */
                                    <button
                                      onClick={() => handleReopenJob(issue)}
                                      className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                      title="Reopen completed job"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDelete(issue.id)}
                                    className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Delete issue"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* VIEW ISSUE & PROGRESS LOG MODAL */}
          {selectedIssueForView && (
            <ViewIssueModal
              issue={selectedIssueForView}
              user={user}
              issueTypes={issueTypes}
              repeatOptions={repeatOptions}
              priorityOptions={priorityOptions}
              statusOptions={statusOptions}
              onClose={() => setSelectedIssueForView(null)}
              onUpdate={handleUpdateIssue}
              onEditClick={() => {
                const issueToEdit = selectedIssueForView;
                setSelectedIssueForView(null);
                setSelectedIssueForEdit(issueToEdit);
              }}
              onCompleteClick={() => {
                const issueToComplete = selectedIssueForView;
                setSelectedIssueForView(null);
                setSelectedIssueForComplete(issueToComplete);
              }}
              onReopenClick={async () => {
                await handleReopenJob(selectedIssueForView);
                setSelectedIssueForView(null);
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* EDIT ISSUE MODAL */}
          {selectedIssueForEdit && (
            <EditIssueModal
              issue={selectedIssueForEdit}
              issueTypes={issueTypes}
              repeatOptions={repeatOptions}
              priorityOptions={priorityOptions}
              statusOptions={statusOptions}
              onClose={() => setSelectedIssueForEdit(null)}
              onSave={async (formData) => {
                const meta = parseIssueMetadata(selectedIssueForEdit.photoUrls);
                const updatedMeta = {
                  ...meta,
                  priority: formData.priority,
                  status: formData.status
                };
                await handleUpdateIssue(selectedIssueForEdit.id, {
                  ...formData,
                  photoUrls: updatedMeta
                });
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* QUICK COMPLETE JOB MODAL */}
          {selectedIssueForComplete && (
            <CompleteJobModal
              issue={selectedIssueForComplete}
              user={user}
              onClose={() => setSelectedIssueForComplete(null)}
              onComplete={async (completionData) => {
                const meta = parseIssueMetadata(selectedIssueForComplete.photoUrls);
                const authorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Maintenance Staff';
                const completionEntry = {
                  id: Date.now().toString(),
                  timestamp: new Date().toISOString(),
                  userName: authorName,
                  status: 'COMPLETED',
                  notes: `Job Completed: ${completionData.resolutionNotes}`,
                  hoursSpent: completionData.totalHours || '',
                  partsUsed: completionData.partsUsed || '',
                  cost: completionData.totalCost || ''
                };

                const updatedMeta = {
                  ...meta,
                  status: 'COMPLETED',
                  completionDetails: {
                    completedAt: new Date().toISOString(),
                    completedBy: authorName,
                    resolutionNotes: completionData.resolutionNotes,
                    totalHours: completionData.totalHours || '',
                    partsUsed: completionData.partsUsed || '',
                    totalCost: completionData.totalCost || ''
                  },
                  progressLogs: [completionEntry, ...meta.progressLogs]
                };

                await handleUpdateIssue(selectedIssueForComplete.id, {
                  ...selectedIssueForComplete,
                  completed: 'YES',
                  photoUrls: updatedMeta
                });
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* REPORT ISSUE MODAL */}
          {showReportModal && (
            <ReportIssueModal
              issueTypes={issueTypes}
              repeatOptions={repeatOptions}
              priorityOptions={priorityOptions}
              user={user}
              onClose={() => setShowReportModal(false)}
              onSave={async (formData) => {
                try {
                  setIsSubmitting(true);
                  const token = localStorage.getItem('token');
                  const authorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Staff';

                  // Structured metadata for photoUrls
                  const initialMetadata = {
                    priority: formData.priority || 'MEDIUM',
                    status: formData.completed === 'YES' ? 'COMPLETED' : 'PENDING',
                    progressLogs: formData.initialNotes
                      ? [
                          {
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            userName: authorName,
                            status: formData.completed === 'YES' ? 'COMPLETED' : 'PENDING',
                            notes: formData.initialNotes,
                            hoursSpent: '',
                            partsUsed: ''
                          }
                        ]
                      : [],
                    comments: [],
                    completionDetails:
                      formData.completed === 'YES'
                        ? {
                            completedAt: new Date().toISOString(),
                            completedBy: authorName,
                            resolutionNotes: formData.initialNotes || 'Completed at report time'
                          }
                        : null,
                    photos: []
                  };

                  const requestBody = {
                    ...formData,
                    for: formData.for,
                    photoUrls: initialMetadata
                  };

                  const response = await fetch('/api/maintenance-issues', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
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

// ==========================================
// 1. VIEW ISSUE & PROGRESS LOG MODAL
// ==========================================
function ViewIssueModal({
  issue,
  user,
  issueTypes,
  repeatOptions,
  priorityOptions,
  statusOptions,
  onClose,
  onUpdate,
  onEditClick,
  onCompleteClick,
  onReopenClick,
  isSubmitting
}) {
  const meta = parseIssueMetadata(issue.photoUrls);
  const priorityObj = priorityOptions.find((p) => p.value === meta.priority) || priorityOptions[1];
  const statusObj = statusOptions.find((s) => s.value === meta.status) || (issue.completed === 'YES' ? statusOptions[4] : statusOptions[0]);
  const isCompleted = issue.completed === 'YES';

  // Sub-tabs in modal
  const [modalTab, setModalTab] = useState('progress'); // 'progress' | 'comments' | 'details'

  // New progress update form state
  const [progressStatus, setProgressStatus] = useState(meta.status || 'IN_PROGRESS');
  const [progressNotes, setProgressNotes] = useState('');
  const [progressHours, setProgressHours] = useState('');
  const [progressParts, setProgressParts] = useState('');
  const [progressCost, setProgressCost] = useState('');
  const [progressError, setProgressError] = useState('');

  // New comment state
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const currentUserName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Maintenance Staff';

  // Handle logging progress
  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!progressNotes.trim()) {
      setProgressError('Please write a brief description of the work done or update.');
      return;
    }
    setProgressError('');

    const newLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userName: currentUserName,
      status: progressStatus,
      notes: progressNotes.trim(),
      hoursSpent: progressHours.trim(),
      partsUsed: progressParts.trim(),
      cost: progressCost.trim()
    };

    const shouldMarkCompleted = progressStatus === 'COMPLETED';
    const updatedCompletionDetails = shouldMarkCompleted
      ? {
          completedAt: new Date().toISOString(),
          completedBy: currentUserName,
          resolutionNotes: progressNotes.trim(),
          totalHours: progressHours.trim(),
          partsUsed: progressParts.trim(),
          totalCost: progressCost.trim()
        }
      : meta.completionDetails;

    const updatedMeta = {
      ...meta,
      status: progressStatus,
      completionDetails: updatedCompletionDetails,
      progressLogs: [newLogEntry, ...meta.progressLogs]
    };

    const success = await onUpdate(issue.id, {
      ...issue,
      completed: shouldMarkCompleted ? 'YES' : issue.completed,
      photoUrls: updatedMeta
    });

    if (success) {
      setProgressNotes('');
      setProgressHours('');
      setProgressParts('');
      setProgressCost('');
    }
  };

  // Handle adding team comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setCommentError('');

    const newComment = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userName: currentUserName,
      comment: commentText.trim()
    };

    const updatedMeta = {
      ...meta,
      comments: [...meta.comments, newComment]
    };

    const success = await onUpdate(issue.id, {
      ...issue,
      photoUrls: updatedMeta
    });

    if (success) {
      setCommentText('');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c408c] to-[#2563eb] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">#{issue.id}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium">
                  {issueTypes.find((t) => t.value === issue.issueType)?.label || issue.issueType}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>
                  {statusObj.label}
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-white truncate max-w-md">
                {issue.for ? `${issue.for} - ` : ''}{issue.issue}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEditClick}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Completion Banner (if completed) */}
        {isCompleted && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-emerald-800">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs">
                <span className="font-bold">Job Completed: </span>
                <span>
                  {meta.completionDetails?.completedAt ? new Date(meta.completionDetails.completedAt).toLocaleString('en-GB') : 'Signed off'}
                </span>
                {meta.completionDetails?.completedBy && (
                  <span className="text-emerald-700 font-medium"> by {meta.completionDetails.completedBy}</span>
                )}
                {meta.completionDetails?.resolutionNotes && (
                  <p className="text-emerald-900 mt-0.5 italic">&quot;{meta.completionDetails.resolutionNotes}&quot;</p>
                )}
              </div>
            </div>
            <button
              onClick={onReopenClick}
              className="text-xs bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg font-medium transition-colors"
            >
              Reopen Job
            </button>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/70">
          <button
            onClick={() => setModalTab('progress')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              modalTab === 'progress'
                ? 'border-[#224fa6] text-[#224fa6] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Progress & Work Log</span>
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {meta.progressLogs?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setModalTab('comments')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              modalTab === 'comments'
                ? 'border-[#224fa6] text-[#224fa6] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comments & Notes</span>
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {meta.comments?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setModalTab('details')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              modalTab === 'details'
                ? 'border-[#224fa6] text-[#224fa6] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Overview & Info</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROGRESS & WORK LOG */}
          {modalTab === 'progress' && (
            <div className="space-y-6">
              {/* Add Progress Log Form */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 lg:p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Log Work Update or Progress</span>
                </h4>
                <form onSubmit={handleAddProgress} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Status Update</label>
                      <select
                        value={progressStatus}
                        onChange={(e) => setProgressStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Time Spent (e.g. 1.5 hrs)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 hr 15 mins"
                        value={progressHours}
                        onChange={(e) => setProgressHours(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Work Performed / Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe what work was done, parts replaced, diagnostic findings, or next steps..."
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 resize-y"
                    />
                    {progressError && <p className="text-xs text-red-500 mt-1">{progressError}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Parts / Materials Used (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Sealant, replacement bulb, 15mm valve"
                        value={progressParts}
                        onChange={(e) => setProgressParts(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Cost / Receipts (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. £24.50"
                        value={progressCost}
                        onChange={(e) => setProgressCost(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-gray-500">
                      Logged as: <strong className="text-gray-700">{currentUserName}</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#224fa6] hover:bg-[#1a3e85] text-white text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving Log...' : 'Add Progress Log'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Progress Log Timeline */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Maintenance History Timeline</span>
                </h4>

                {meta.progressLogs && meta.progressLogs.length > 0 ? (
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {meta.progressLogs.map((log) => {
                      const logStatus = statusOptions.find((s) => s.value === log.status) || statusOptions[0];
                      return (
                        <div key={log.id} className="relative group">
                          {/* Dot */}
                          <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            log.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#224fa6]'
                          }`} />

                          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:border-blue-200 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-xs text-gray-900">{log.userName}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${logStatus.badgeClass}`}>
                                  {logStatus.label}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {new Date(log.timestamp).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{log.notes}</p>

                            {(log.hoursSpent || log.partsUsed || log.cost) && (
                              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 text-[11px]">
                                {log.hoursSpent && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                    ⏱️ {log.hoursSpent}
                                  </span>
                                )}
                                {log.partsUsed && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                    🔧 {log.partsUsed}
                                  </span>
                                )}
                                {log.cost && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                    💰 {log.cost}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium">No progress updates logged yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Use the form above to record work completed or status changes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMMENTS & NOTES */}
          {modalTab === 'comments' && (
            <div className="space-y-6">
              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <label className="block text-xs font-semibold text-gray-700">Add Internal Note or Comment</label>
                <textarea
                  rows={3}
                  placeholder="Leave a comment for staff, shift leads, or other maintenance workers..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                />
                {commentError && <p className="text-xs text-red-500">{commentError}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#224fa6] text-white text-xs font-semibold rounded-lg hover:shadow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Comment Thread</h4>
                {meta.comments && meta.comments.length > 0 ? (
                  meta.comments.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{c.userName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{c.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No comments yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW & DETAILS */}
          {modalTab === 'details' && (
            <div className="space-y-6">
              {/* Core Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Issue Type</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {issueTypes.find((t) => t.value === issue.issueType)?.label || issue.issueType}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Equipment / Location</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{issue.for || 'Not specified'}</p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Priority</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${priorityObj.badgeClass}`}>
                      {priorityObj.label}
                    </span>
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reported Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString('en-GB') : '-'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Recurrence</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {repeatOptions.find((r) => r.value === issue.repeats)?.label || issue.repeats || 'No'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reported By</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {issue.createdBy ? `${issue.createdBy.firstName || ''} ${issue.createdBy.lastName || ''}`.trim() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Issue Description</p>
                <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{issue.issue}</p>
              </div>

              {/* Completion Details (if completed) */}
              {isCompleted && meta.completionDetails && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Completion & Sign-Off Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Completed At: </span>
                      <strong className="text-gray-800">
                        {meta.completionDetails.completedAt ? new Date(meta.completionDetails.completedAt).toLocaleString('en-GB') : '-'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Signed Off By: </span>
                      <strong className="text-gray-800">{meta.completionDetails.completedBy || '-'}</strong>
                    </div>
                    {meta.completionDetails.totalHours && (
                      <div>
                        <span className="text-gray-500">Total Hours: </span>
                        <strong className="text-gray-800">{meta.completionDetails.totalHours}</strong>
                      </div>
                    )}
                    {meta.completionDetails.totalCost && (
                      <div>
                        <span className="text-gray-500">Total Cost: </span>
                        <strong className="text-gray-800">{meta.completionDetails.totalCost}</strong>
                      </div>
                    )}
                  </div>

                  {meta.completionDetails.resolutionNotes && (
                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-xs text-gray-500 block mb-1">Resolution Summary:</span>
                      <p className="text-xs text-gray-800 bg-white p-2.5 rounded-lg border border-emerald-100">
                        {meta.completionDetails.resolutionNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isCompleted ? (
              <button
                type="button"
                onClick={onCompleteClick}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Mark as Completed</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onReopenClick}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                Reopen Job
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. EDIT ISSUE MODAL
// ==========================================
function EditIssueModal({
  issue,
  issueTypes,
  repeatOptions,
  priorityOptions,
  statusOptions,
  onClose,
  onSave,
  isSubmitting
}) {
  const meta = parseIssueMetadata(issue.photoUrls);

  const [formData, setFormData] = useState({
    issueType: issue.issueType || '',
    for: issue.for || '',
    issue: issue.issue || '',
    repeats: issue.repeats || 'NO',
    issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split('T')[0] : '',
    completed: issue.completed || 'NO',
    priority: meta.priority || 'MEDIUM',
    status: meta.status || 'PENDING'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.issueType) newErrors.issueType = 'Issue Type is required';
    if (!formData.issue) newErrors.issue = 'Issue description is required';
    if (!formData.issueDate) newErrors.issueDate = 'Issue Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-lg font-bold">Edit Maintenance Issue #{issue.id}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Issue Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900 ${
                  errors.issueType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Please Select</option>
                {issueTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.issueType && <p className="text-xs text-red-500 mt-1">{errors.issueType}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* For / Equipment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment / Location / For</label>
            <input
              type="text"
              value={formData.for}
              onChange={(e) => setFormData({ ...formData, for: e.target.value })}
              placeholder="e.g. Room 102 Radiator, Van 3, Kitchen Dishwasher"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900 resize-y ${
                errors.issue ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.issue && <p className="text-xs text-red-500 mt-1">{errors.issue}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Repeats */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Repeats</label>
              <select
                value={formData.repeats}
                onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900 ${
                  errors.issueDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.issueDate && <p className="text-xs text-red-500 mt-1">{errors.issueDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Job Status</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFormData({
                    ...formData,
                    status: newStatus,
                    completed: newStatus === 'COMPLETED' ? 'YES' : 'NO'
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Completed */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Completed Flag</label>
              <select
                value={formData.completed}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    completed: val,
                    status: val === 'YES' ? 'COMPLETED' : (formData.status === 'COMPLETED' ? 'IN_PROGRESS' : formData.status)
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
              >
                <option value="NO">No (Active)</option>
                <option value="YES">Yes (Completed)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. QUICK COMPLETE JOB MODAL
// ==========================================
function CompleteJobModal({ issue, user, onClose, onComplete, isSubmitting }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide a resolution summary describing what was done.');
      return;
    }
    setError('');
    onComplete({
      resolutionNotes: resolutionNotes.trim(),
      totalHours: totalHours.trim(),
      partsUsed: partsUsed.trim(),
      totalCost: totalCost.trim()
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold">Complete Job #{issue.id}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
            <p className="font-semibold text-gray-800">{issue.for ? `${issue.for}: ` : ''}{issue.issue}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Resolution Summary / Work Done <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Replaced faulty heating element, tested water flow, all operating normally."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Time Spent</label>
              <input
                type="text"
                placeholder="e.g. 2 hours"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cost (Optional)</label>
              <input
                type="text"
                placeholder="e.g. £55.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Parts or Materials Used (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1x 240V Heating element, gaskets"
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
            />
          </div>

          <div className="text-[11px] text-gray-500">
            Sign-off technician: <strong className="text-gray-800">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Maintenance Staff'}</strong>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing...' : 'Confirm Job Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. REPORT ISSUE MODAL
// ==========================================
function ReportIssueModal({
  issueTypes,
  repeatOptions,
  priorityOptions,
  user,
  onClose,
  onSave,
  isSubmitting
}) {
  const [formData, setFormData] = useState({
    issueType: '',
    for: '',
    issue: '',
    repeats: 'NO',
    issueDate: new Date().toISOString().split('T')[0],
    completed: 'NO',
    priority: 'MEDIUM',
    initialNotes: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.issueType) newErrors.issueType = 'Category is required';
    if (!formData.issue) newErrors.issue = 'Issue description is required';
    if (!formData.issueDate) newErrors.issueDate = 'Issue Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-lg font-bold">Report New Maintenance Issue</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 ${
                  errors.issueType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Please Select</option>
                {issueTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.issueType && <p className="mt-1 text-xs text-red-500">{errors.issueType}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* For / Equipment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Equipment / For</label>
            <input
              type="text"
              value={formData.for}
              onChange={(e) => setFormData({ ...formData, for: e.target.value })}
              placeholder="e.g. Room 204 Heating, Kitchen Refrigerator, Main Entry Gate"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="Describe the issue, symptoms observed, or immediate danger..."
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 resize-y ${
                errors.issue ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.issue && <p className="mt-1 text-xs text-red-500">{errors.issue}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Repeats */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Repeats</label>
              <select
                value={formData.repeats}
                onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 ${
                  errors.issueDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.issueDate && <p className="mt-1 text-xs text-red-500">{errors.issueDate}</p>}
            </div>
          </div>

          {/* Initial Work Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Initial Work Note or Action Taken (Optional)
            </label>
            <input
              type="text"
              value={formData.initialNotes}
              onChange={(e) => setFormData({ ...formData, initialNotes: e.target.value })}
              placeholder="e.g. Turned off isolation valve, placed hazard sign"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
            />
          </div>

          {/* Readonly info */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 text-xs">
            <div>
              <span className="text-gray-500">Reported By: </span>
              <strong className="text-gray-800">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}</strong>
            </div>
            <div>
              <span className="text-gray-500">Timestamp: </span>
              <strong className="text-gray-800">{new Date().toLocaleDateString('en-GB')}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-[#224fa6] hover:bg-[#1b3f86] text-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
