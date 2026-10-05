'use client';

import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ROLES = [
  { value: 'Service User / Resident', label: 'Service User / Resident', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'Family Member / Next of Kin', label: 'Family Member / Next of Kin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Staff / Care Worker', label: 'Staff / Care Worker', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'Professional / Social Worker', label: 'Professional / Social Worker', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'Visitor / Volunteer', label: 'Visitor / Volunteer', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'Advocate', label: 'Advocate', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'Other', label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const RAISED_CHANNELS = [
  'Residents Meeting',
  'Family Meeting',
  '1:1 Review / Keyworker Session',
  'Verbal / In-Person Conversation',
  'Survey / Feedback Questionnaire',
  'Suggestion Box',
  'Phone Call',
  'Email / Written Letter',
  'Care Plan Review',
  'Other'
];

const STATUSES = [
  { value: 'OPEN', label: 'Open / Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'CLOSED', label: 'Implemented / Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

const FEEDBACK_TYPES = [
  { value: 'SUGGESTION', label: 'Suggestion' },
  { value: 'CONCERN', label: 'Concern' },
  { value: 'COMPLIMENT', label: 'Compliment' },
];

function getRoleBadge(role) {
  const match = ROLES.find(r => r.value.toLowerCase() === (role || '').toLowerCase());
  return match ? match.color : 'bg-gray-100 text-gray-800 border-gray-200';
}

function getStatusBadge(status) {
  const match = STATUSES.find(s => s.value === status);
  return match ? match.color : 'bg-gray-100 text-gray-800 border-gray-200';
}

function getStatusLabel(status) {
  const match = STATUSES.find(s => s.value === status);
  return match ? match.label : status || 'Open';
}

export default function YouSaidWeDidManager({ user, serviceSeekers = [], onNotification }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterHowRaised, setFilterHowRaised] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterHowRaised !== 'all') params.append('howRaised', filterHowRaised);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const res = await fetch(`/api/quality-assurance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setEntries(result.data);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('Error fetching You Said We Did entries:', err);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterHowRaised, filterStatus, filterStartDate, filterEndDate]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/quality-assurance/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setEntries(prev => prev.filter(e => e.id !== id));
        onNotification('Entry deleted successfully', 'success');
      } else {
        onNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      onNotification('Error deleting entry. Please try again.', 'error');
    }
  };

  const handleSave = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const url = selectedEntry
        ? `/api/quality-assurance/${selectedEntry.id}`
        : '/api/quality-assurance';
      const method = selectedEntry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        onNotification(selectedEntry ? 'Record updated successfully' : 'Record created successfully', 'success');
        setShowModal(false);
        setSelectedEntry(null);
        fetchEntries();
      } else {
        onNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      onNotification('Error saving record. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const personName = e.person || e.from || '';
      const roleText = e.role || '';
      const howRaisedText = e.howRaised || '';
      const youSaidText = e.youSaid || '';
      const weDidText = e.weDid || '';

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          personName.toLowerCase().includes(q) ||
          roleText.toLowerCase().includes(q) ||
          howRaisedText.toLowerCase().includes(q) ||
          youSaidText.toLowerCase().includes(q) ||
          weDidText.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [entries, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = entries.length;
    const completed = entries.filter(e => e.status === 'CLOSED').length;
    const inProgress = entries.filter(e => e.status === 'IN_PROGRESS').length;
    const open = entries.filter(e => e.status === 'OPEN' || !e.status).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, open, rate };
  }, [entries]);

  // Export PDF matching the exact template columns
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      // Title & Header Branding
      doc.setFontSize(16);
      doc.setTextColor(34, 79, 166); // #224fa6
      doc.text('You Said, We Did - Continuous Improvement Register', 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Generated: ${exportDate} | Total Records: ${filteredEntries.length} | Implementation Rate: ${stats.rate}%`, 14, 25);

      // Exact columns matching the paper template:
      // Date | Person | Role | How was this raised? | You Said | We Did
      const tableData = filteredEntries.map(e => [
        e.date ? new Date(e.date).toLocaleDateString('en-GB') : '-',
        e.person || e.from || '-',
        e.role || 'Not Specified',
        e.howRaised || 'Not Specified',
        e.youSaid || '-',
        e.weDid || 'Pending action / In progress'
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Date', 'Person', 'Role', 'How was this raised?', 'You Said', 'We Did']],
        body: tableData,
        headStyles: {
          fillColor: [34, 79, 166],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3.5,
          overflow: 'linebreak',
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 24 }, // Date
          1: { cellWidth: 35 }, // Person
          2: { cellWidth: 35 }, // Role
          3: { cellWidth: 38 }, // How was this raised?
          4: { cellWidth: 70 }, // You Said
          5: { cellWidth: 72 }  // We Did
        }
      });

      doc.save(`You_Said_We_Did_Register_${new Date().toISOString().split('T')[0]}.pdf`);
      onNotification('PDF exported successfully!', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      onNotification('Error generating PDF report', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterHowRaised('all');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#224fa6]">
              Quality & Continuous Improvement
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">You Said, We Did</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Log feedback from residents, families, and staff, demonstrating concrete actions taken and continuous service improvements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedEntry(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#224fa6] text-sm font-semibold text-white hover:bg-[#1a3e85] shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Feedback Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Feedback</span>
            <span className="p-2 rounded-lg bg-blue-50 text-[#224fa6]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
          <p className="text-xs text-gray-500 mt-1">Feedback items recorded</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">&quot;We Did&quot; Completed</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.completed}</div>
          <p className="text-xs text-gray-500 mt-1">{stats.rate}% resolution rate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{stats.inProgress}</div>
          <p className="text-xs text-gray-500 mt-1">Actions being implemented</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Open / Pending</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{stats.open}</div>
          <p className="text-xs text-gray-500 mt-1">Awaiting manager response</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Search Register</label>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search person, role, method, you said, we did..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-800"
            >
              <option value="all">All Roles</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* How was this raised? Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">How was this raised?</label>
            <select
              value={filterHowRaised}
              onChange={(e) => setFilterHowRaised(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-800"
            >
              <option value="all">All Channels</option>
              {RAISED_CHANNELS.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-800"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500">Date Range:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#224fa6]"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#224fa6]"
            />
          </div>

          {(searchTerm || filterRole !== 'all' || filterHowRaised !== 'all' || filterStatus !== 'all' || filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Matching the Form Exactly */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-base">You Said, We Did Continuous Improvement Log</h3>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <span className="text-xs text-gray-500">Matches official CQC Listening & Feedback form layout</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
            <span className="ml-3 text-sm text-gray-500">Loading register...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#224fa6] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900">No records found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No You Said, We Did records match your filters. Click &quot;Add Feedback Entry&quot; to log a new item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4 w-28">Date</th>
                  <th className="py-3.5 px-4 w-44">Person</th>
                  <th className="py-3.5 px-4 w-40">Role</th>
                  <th className="py-3.5 px-4 w-48">How was this raised?</th>
                  <th className="py-3.5 px-4">You Said</th>
                  <th className="py-3.5 px-4">We Did</th>
                  <th className="py-3.5 px-4 w-32">Status</th>
                  <th className="py-3.5 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEntries.map((entry) => {
                  const personName = entry.person || entry.from || 'Anonymous';
                  const roleText = entry.role || 'Service User / Resident';
                  const howRaisedText = entry.howRaised || 'Residents Meeting';

                  return (
                    <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-800 font-medium text-xs">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : '-'}
                      </td>

                      {/* Person */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 text-xs">
                        {personName}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadge(roleText)}`}>
                          {roleText}
                        </span>
                      </td>

                      {/* How was this raised? */}
                      <td className="py-3.5 px-4 text-xs text-gray-700">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {howRaisedText}
                        </span>
                      </td>

                      {/* You Said */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-900 line-clamp-2" title={entry.youSaid || ''}>
                          {entry.youSaid || <span className="text-gray-400 italic">No text recorded</span>}
                        </div>
                      </td>

                      {/* We Did */}
                      <td className="py-3.5 px-4">
                        {entry.weDid ? (
                          <div className="text-xs text-emerald-900 font-medium line-clamp-2" title={entry.weDid}>
                            {entry.weDid}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                            Action pending
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setViewModal(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#224fa6] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <YouSaidWeDidModal
          entry={selectedEntry}
          serviceSeekers={serviceSeekers}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowModal(false);
            setSelectedEntry(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* View Details Modal */}
      {viewModal && selectedEntry && (
        <YouSaidWeDidDetailModal
          entry={selectedEntry}
          onClose={() => {
            setViewModal(false);
            setSelectedEntry(null);
          }}
          onEdit={() => {
            setViewModal(false);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}

// Add / Edit Entry Modal Component
function YouSaidWeDidModal({ entry, serviceSeekers, isSubmitting, onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: entry ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    person: entry?.person || entry?.from || '',
    role: entry?.role || 'Service User / Resident',
    howRaised: entry?.howRaised || 'Residents Meeting',
    type: entry?.type || 'SUGGESTION',
    youSaid: entry?.youSaid || '',
    weDid: entry?.weDid || '',
    status: entry?.status || 'OPEN',
  });

  const [useResidentPicker, setUseResidentPicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.person.trim()) {
      alert('Please enter or select a person name.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {entry ? 'Edit You Said, We Did Entry' : 'Log New You Said, We Did Feedback'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Record who raised the item, their role, how it was raised, what was said, and what improvement was made.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Person & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Person <span className="text-rose-500">*</span>
                </label>
                {serviceSeekers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseResidentPicker(!useResidentPicker)}
                    className="text-[11px] text-[#224fa6] hover:underline font-medium"
                  >
                    {useResidentPicker ? 'Type name manually' : 'Pick resident'}
                  </button>
                )}
              </div>

              {useResidentPicker && serviceSeekers.length > 0 ? (
                <select
                  value={formData.person}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      person: val,
                      role: 'Service User / Resident'
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select Resident...</option>
                  {serviceSeekers.map(s => (
                    <option key={s.id} value={`${s.firstName} ${s.lastName}`}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith, Jane Doe (Daughter)"
                  value={formData.person}
                  onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: How was this raised? & Category/Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                How was this raised?
              </label>
              <input
                type="text"
                list="raised-channels-list"
                value={formData.howRaised}
                onChange={(e) => setFormData({ ...formData, howRaised: e.target.value })}
                placeholder="e.g. Residents Meeting, Verbal, Survey"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
              <datalist id="raised-channels-list">
                {RAISED_CHANNELS.map(ch => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Feedback Nature
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                {FEEDBACK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* You Said */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              You Said (Feedback / Comment / Request) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail what the person raised, commented, suggested, or expressed..."
              value={formData.youSaid}
              onChange={(e) => setFormData({ ...formData, youSaid: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* We Did */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              We Did (Improvement / Action Taken / Outcome)
            </label>
            <textarea
              rows={4}
              placeholder="Detail the concrete steps taken, changes made to service/routine, equipment purchased, or improvement implemented..."
              value={formData.weDid}
              onChange={(e) => setFormData({ ...formData, weDid: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#224fa6] rounded-xl hover:bg-[#1a3e85] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{entry ? 'Update Record' : 'Save Record'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Details Modal Component
function YouSaidWeDidDetailModal({ entry, onClose, onEdit }) {
  const personName = entry.person || entry.from || 'Anonymous';
  const roleText = entry.role || 'Service User / Resident';
  const howRaisedText = entry.howRaised || 'Residents Meeting';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#224fa6] text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">You Said, We Did Record</h3>
              <p className="text-xs text-gray-500">
                Logged on {entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : '-'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 uppercase">Person</span>
              <span className="block text-xs font-bold text-gray-900 mt-0.5">{personName}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 uppercase">Role</span>
              <span className="block text-xs font-bold text-gray-900 mt-0.5">{roleText}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 uppercase">How Raised</span>
              <span className="block text-xs font-bold text-gray-900 mt-0.5">{howRaisedText}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-gray-500 uppercase">Status</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${getStatusBadge(entry.status)}`}>
                {getStatusLabel(entry.status)}
              </span>
            </div>
          </div>

          {/* You Said Card */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded bg-blue-600 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wide">You Said</h4>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap pl-8">
              {entry.youSaid || 'No feedback details recorded.'}
            </p>
          </div>

          {/* We Did Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded bg-emerald-600 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">We Did</h4>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap pl-8">
              {entry.weDid || (
                <span className="text-amber-700 italic">
                  Action has not been recorded yet. Update this entry when improvements have been implemented.
                </span>
              )}
            </p>
          </div>

          {/* Audit stamps */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-100">
            <span>
              Recorded by: {entry.createdBy ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : 'System'}
            </span>
            {entry.updatedAt && (
              <span>Last updated: {new Date(entry.updatedAt).toLocaleDateString('en-GB')}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#224fa6] rounded-xl hover:bg-[#1a3e85] transition-colors"
          >
            Edit Record
          </button>
        </div>
      </div>
    </div>
  );
}
