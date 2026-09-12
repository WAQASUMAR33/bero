'use client';

import { useEffect, useMemo, useState } from 'react';
import FileUpload from '../../components/FileUpload';

const TABS = [
  {
    key: 'FAMILY_FRIENDS',
    title: 'Family & Friends Communication Log',
    shortTitle: 'Family & Friends',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Log and track all interactions with relatives, next of kin, friends, and legal advocates.'
  },
  {
    key: 'PROFESSIONAL',
    title: 'Professional Communication Log',
    shortTitle: 'Professional Contact',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Record multidisciplinary communications with GPs, Social Workers, District Nurses, OTs, and CQC.'
  },
  {
    key: 'DAILY_NOTES',
    title: 'Daily Notes Log',
    shortTitle: 'Daily Shift Notes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Daily shift summaries, emotional well-being, nutrition/hydration, care delivered, and handover notes.'
  },
];

const FAMILY_RELATIONSHIPS = [
  'Daughter', 'Son', 'Spouse / Partner', 'Mother', 'Father', 'Sister', 'Brother',
  'Granddaughter', 'Grandson', 'Niece / Nephew', 'Power of Attorney (POA)',
  'Next of Kin', 'Close Friend', 'Advocate / Deputy', 'Other Relative'
];

const COMMUNICATION_METHODS = [
  'Telephone Call', 'In-Person Visit', 'Video Call', 'Email', 'SMS / Text Message',
  'Letter / Postal Mail', 'Home Visit', 'Review Meeting', 'Other'
];

const PROFESSIONAL_ROLES = [
  'General Practitioner (GP)', 'Social Worker', 'District Nurse', 'Occupational Therapist (OT)',
  'Physiotherapist', 'Speech & Language Therapist (SALT)', 'Care Coordinator / Manager',
  'CQC Inspector / Auditor', 'Pharmacist', 'Psychiatrist / CPN', 'Hospital Discharge Coordinator',
  'Chiropodist / Podiatrist', 'Optician / Audiologist', 'Dietitian', 'Other Healthcare Professional'
];

const SHIFTS = [
  'Morning Shift (AM)', 'Afternoon Shift (PM)', 'Evening Shift (Tea/Late)', 'Night Shift (Sleep-in / Waking)'
];

const MOODS = [
  { value: 'Happy & Cheerful', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  { value: 'Settled & Calm', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  { value: 'Quiet & Reserved', color: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' },
  { value: 'Anxious & Distressed', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  { value: 'Agitated / Confused', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  { value: 'Unwell / Lethargic', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
];

export default function CommunicationLogsForm({ serviceSeekerId, serviceUserName = '', onNotification }) {
  const [activeTab, setActiveTab] = useState('FAMILY_FRIENDS');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const initialFormState = {
    id: null,
    logType: 'FAMILY_FRIENDS',
    dateTime: new Date().toISOString().slice(0, 16),
    staffName: '',
    contactName: '',
    relationshipOrRole: '',
    organization: '',
    category: '',
    summary: '',
    details: '',
    actions: '',
    attachmentUrl: '',
    // Metadata fields
    direction: 'Incoming',
    priority: 'Routine',
    mood: 'Settled & Calm',
    nutritionSummary: 'Ate well / all meals',
    hydrationSummary: 'Good fluid intake',
    medicationSummary: 'Administered as prescribed',
    handoverFlag: false,
    followUpDate: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (serviceSeekerId) {
      fetchRecords();
    }
  }, [serviceSeekerId]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e);
    }
  };

  const fetchRecords = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/communication-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching communication records:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeDisplay = (s) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return s || '-';
    }
  };

  const formatDateDisplay = (s) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return s || '-';
    }
  };

  // Counts for each tab
  const tabCounts = useMemo(() => {
    const counts = { FAMILY_FRIENDS: 0, PROFESSIONAL: 0, DAILY_NOTES: 0 };
    records.forEach(r => {
      if (counts[r.logType] !== undefined) {
        counts[r.logType]++;
      }
    });
    return counts;
  }, [records]);

  // Filtered records for active tab
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.logType !== activeTab) return false;

      if (dateFilter) {
        try {
          const recDate = new Date(r.dateTime).toISOString().substring(0, 10);
          if (recDate !== dateFilter) return false;
        } catch {
          // ignore
        }
      }

      if (categoryFilter) {
        if (r.category !== categoryFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contact = (r.contactName || '').toLowerCase();
        const relOrRole = (r.relationshipOrRole || '').toLowerCase();
        const org = (r.organization || '').toLowerCase();
        const staff = (r.staffName || '').toLowerCase();
        const sum = (r.summary || '').toLowerCase();
        const det = (r.details || '').toLowerCase();
        const act = (r.actions || '').toLowerCase();

        return (
          contact.includes(q) ||
          relOrRole.includes(q) ||
          org.includes(q) ||
          staff.includes(q) ||
          sum.includes(q) ||
          det.includes(q) ||
          act.includes(q)
        );
      }

      return true;
    });
  }, [records, activeTab, dateFilter, categoryFilter, searchQuery]);

  const openAddModal = () => {
    setIsEditing(false);
    const storedUser = localStorage.getItem('user');
    let staffName = '';
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        staffName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      } catch {}
    }

    setFormData({
      ...initialFormState,
      logType: activeTab,
      staffName: staffName || '',
      category: activeTab === 'DAILY_NOTES' ? 'Morning Shift (AM)' : 'Telephone Call',
      relationshipOrRole: activeTab === 'FAMILY_FRIENDS' ? 'Daughter' : activeTab === 'PROFESSIONAL' ? 'General Practitioner (GP)' : '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (rec) => {
    setIsEditing(true);
    const meta = rec.metadata || {};
    setFormData({
      id: rec.id,
      logType: rec.logType,
      dateTime: rec.dateTime ? new Date(rec.dateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      staffName: rec.staffName || '',
      contactName: rec.contactName || '',
      relationshipOrRole: rec.relationshipOrRole || '',
      organization: rec.organization || '',
      category: rec.category || '',
      summary: rec.summary || '',
      details: rec.details || '',
      actions: rec.actions || '',
      attachmentUrl: rec.attachmentUrl || '',
      direction: meta.direction || 'Incoming',
      priority: meta.priority || 'Routine',
      mood: meta.mood || 'Settled & Calm',
      nutritionSummary: meta.nutritionSummary || 'Ate well / all meals',
      hydrationSummary: meta.hydrationSummary || 'Good fluid intake',
      medicationSummary: meta.medicationSummary || 'Administered as prescribed',
      handoverFlag: !!meta.handoverFlag,
      followUpDate: meta.followUpDate || '',
    });
    setShowAddModal(true);
  };

  const openViewModal = (rec) => {
    setSelectedRecord(rec);
    setShowViewModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!serviceSeekerId) return;

    if (!formData.summary?.trim() && !formData.details?.trim()) {
      if (onNotification) onNotification({ show: true, message: 'Please provide a summary or details for this record.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        id: formData.id,
        logType: formData.logType,
        dateTime: formData.dateTime ? new Date(formData.dateTime).toISOString() : new Date().toISOString(),
        staffName: formData.staffName?.trim() || null,
        contactName: formData.contactName?.trim() || null,
        relationshipOrRole: formData.relationshipOrRole?.trim() || null,
        organization: formData.organization?.trim() || null,
        category: formData.category?.trim() || null,
        summary: formData.summary?.trim() || null,
        details: formData.details?.trim() || null,
        actions: formData.actions?.trim() || null,
        attachmentUrl: formData.attachmentUrl || null,
        metadata: {
          direction: formData.direction,
          priority: formData.priority,
          mood: formData.mood,
          nutritionSummary: formData.nutritionSummary,
          hydrationSummary: formData.hydrationSummary,
          medicationSummary: formData.medicationSummary,
          handoverFlag: formData.handoverFlag,
          followUpDate: formData.followUpDate || null,
        }
      };

      const url = `/api/service-seekers/${serviceSeekerId}/communication-records`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchRecords();
        setShowAddModal(false);
        if (onNotification) {
          onNotification({
            show: true,
            message: isEditing ? 'Communication record updated successfully.' : 'Communication record logged successfully.',
            type: 'success'
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (onNotification) {
          onNotification({ show: true, message: err.error || 'Failed to save communication record.', type: 'error' });
        }
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to save communication record.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    setRecordToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/communication-records?id=${recordToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchRecords();
        setShowDeleteConfirm(false);
        setRecordToDelete(null);
        if (onNotification) onNotification({ show: true, message: 'Record deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        if (onNotification) onNotification({ show: true, message: err.error || 'Failed to delete record.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to delete record.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <h2 className="text-xl font-bold tracking-tight">Communication Logs / Records</h2>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              Family & Friends communications, professional multidisciplinary contacts, and daily care shift notes
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#224fa6] font-semibold text-sm rounded-lg hover:bg-blue-50 shadow-md transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>
              {activeTab === 'FAMILY_FRIENDS' && 'Log Family Contact'}
              {activeTab === 'PROFESSIONAL' && 'Log Professional Contact'}
              {activeTab === 'DAILY_NOTES' && 'Add Daily Note'}
            </span>
          </button>
        </div>
      </div>

      {/* 3 Sub-sections Navigation Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 pt-4">
        <div className="flex flex-wrap gap-2 sm:gap-3" role="tablist">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setCategoryFilter('');
                }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-t-xl font-medium text-sm transition-all duration-150 cursor-pointer border-t-2 border-x ${
                  isActive
                    ? 'bg-white text-[#224fa6] border-t-[#224fa6] border-x-gray-200 shadow-sm font-semibold'
                    : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200/70 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-[#224fa6]' : 'text-gray-400'}>{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-bold border ${
                    isActive ? tab.badgeColor : 'bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Active Tab Info Banner */}
        <div className="mb-5 p-3.5 bg-blue-50/70 rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <span className="font-semibold">{TABS.find(t => t.key === activeTab)?.title}:</span>
            <span className="text-blue-700 text-xs sm:text-sm">{TABS.find(t => t.key === activeTab)?.description}</span>
          </div>
          <span className="text-xs font-semibold text-blue-800 bg-white px-2.5 py-1 rounded-md border border-blue-200 shadow-xs self-start sm:self-auto">
            Total: {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Search & Filters Bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={`Search in ${TABS.find(t => t.key === activeTab)?.shortTitle}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
            />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all text-gray-700"
              title="Filter by specific date"
            />
          </div>

          {/* Category / Method / Shift Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all text-gray-700"
            >
              <option value="">
                {activeTab === 'DAILY_NOTES' ? 'All Shifts' : 'All Communication Methods'}
              </option>
              {activeTab === 'DAILY_NOTES'
                ? SHIFTS.map(s => <option key={s} value={s}>{s}</option>)
                : COMMUNICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)
              }
            </select>
          </div>

          {/* Clear Filters / Actions */}
          <div className="flex items-center gap-2">
            {(searchQuery || dateFilter || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                  setCategoryFilter('');
                }}
                className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={openAddModal}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-[#224fa6] text-white rounded-lg text-xs font-semibold hover:bg-[#1a3d85] transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Main Records Display */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-gray-200 border-t-[#224fa6] mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Loading communication records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#224fa6] flex items-center justify-center mx-auto mb-3">
              {TABS.find(t => t.key === activeTab)?.icon}
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              No {TABS.find(t => t.key === activeTab)?.shortTitle} found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
              {searchQuery || dateFilter || categoryFilter
                ? 'No records match your selected search or filter criteria.'
                : `Keep records up to date by logging all ${TABS.find(t => t.key === activeTab)?.shortTitle.toLowerCase()} interactions.`}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#224fa6] text-white rounded-lg text-sm font-medium hover:bg-[#1a3d85] transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add First {TABS.find(t => t.key === activeTab)?.shortTitle}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs">
            {/* 1. FAMILY AND FRIENDS TABLE */}
            {activeTab === 'FAMILY_FRIENDS' && (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100/80 text-gray-700 uppercase tracking-wider text-xs border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Family / Friend</th>
                    <th className="py-3.5 px-4">Method & Direction</th>
                    <th className="py-3.5 px-4">Recorded By</th>
                    <th className="py-3.5 px-4">Topic / Summary</th>
                    <th className="py-3.5 px-4">Follow-Up Actions</th>
                    <th className="py-3.5 px-4 text-center">Attachment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r, idx) => {
                    const meta = r.metadata || {};
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatDateTimeDisplay(r.dateTime)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{r.contactName || 'Family Member'}</div>
                          {r.relationshipOrRole && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                              {r.relationshipOrRole}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 font-medium text-gray-800 text-xs">
                              {r.category || 'Telephone Call'}
                            </span>
                            <span className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              meta.direction === 'Outgoing'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {meta.direction === 'Outgoing' ? '↗ Outgoing' : '↙ Incoming'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                          {r.staffName || '-'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-gray-900 truncate" title={r.summary || ''}>{r.summary || '-'}</div>
                          {r.details && (
                            <div className="text-xs text-gray-500 truncate mt-0.5" title={r.details}>
                              {r.details}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          {r.actions ? (
                            <div className="text-xs text-gray-700 line-clamp-2" title={r.actions}>
                              {r.actions}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.attachmentUrl ? (
                            <a
                              href={r.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open attachment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openViewModal(r)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(r.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete record"
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
            )}

            {/* 2. PROFESSIONAL COMMUNICATION LOG TABLE */}
            {activeTab === 'PROFESSIONAL' && (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100/80 text-gray-700 uppercase tracking-wider text-xs border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Professional & Role</th>
                    <th className="py-3.5 px-4">Organisation / Surgery</th>
                    <th className="py-3.5 px-4">Method & Priority</th>
                    <th className="py-3.5 px-4">Recorded By</th>
                    <th className="py-3.5 px-4">Discussion / Subject</th>
                    <th className="py-3.5 px-4">Agreed Actions & Review</th>
                    <th className="py-3.5 px-4 text-center">Attachment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r, idx) => {
                    const meta = r.metadata || {};
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatDateTimeDisplay(r.dateTime)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{r.contactName || 'Healthcare Professional'}</div>
                          {r.relationshipOrRole && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                              {r.relationshipOrRole}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-800">
                          {r.organization ? (
                            <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                              {r.organization}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-800">{r.category || 'MDT Meeting'}</span>
                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                meta.direction === 'Outgoing' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {meta.direction === 'Outgoing' ? '↗ Outgoing' : '↙ Incoming'}
                              </span>
                              {meta.priority === 'Urgent' && (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  ⚡ Urgent
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                          {r.staffName || '-'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-gray-900 truncate" title={r.summary || ''}>{r.summary || '-'}</div>
                          {r.details && (
                            <div className="text-xs text-gray-500 truncate mt-0.5" title={r.details}>
                              {r.details}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          {r.actions ? (
                            <div className="text-xs text-gray-700 line-clamp-2" title={r.actions}>
                              {r.actions}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                          {meta.followUpDate && (
                            <div className="text-[11px] text-blue-700 font-medium mt-1">
                              Review: {formatDateDisplay(meta.followUpDate)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.attachmentUrl ? (
                            <a
                              href={r.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openViewModal(r)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(r.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete record"
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
            )}

            {/* 3. DAILY NOTES LOG TABLE */}
            {activeTab === 'DAILY_NOTES' && (
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100/80 text-gray-700 uppercase tracking-wider text-xs border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Shift</th>
                    <th className="py-3.5 px-4">Carer / Staff</th>
                    <th className="py-3.5 px-4">Mood & Well-being</th>
                    <th className="py-3.5 px-4">Care Delivered & Summary</th>
                    <th className="py-3.5 px-4">Nutrition / Fluids / Meds</th>
                    <th className="py-3.5 px-4 text-center">Handover Flag</th>
                    <th className="py-3.5 px-4 text-center">Attachment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r, idx) => {
                    const meta = r.metadata || {};
                    const moodConfig = MOODS.find(m => m.value === meta.mood) || MOODS[1];
                    return (
                      <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatDateTimeDisplay(r.dateTime)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            {r.category || 'Morning Shift (AM)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-800 font-medium">
                          {r.staffName || '-'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {meta.mood ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${moodConfig.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${moodConfig.dot}`}></span>
                              {meta.mood}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-gray-900 truncate" title={r.summary || ''}>{r.summary || '-'}</div>
                          {r.details && (
                            <div className="text-xs text-gray-600 line-clamp-2 mt-0.5" title={r.details}>
                              {r.details}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex flex-col gap-0.5 text-gray-600">
                            {meta.nutritionSummary && <div><span className="font-semibold text-gray-700">Meals:</span> {meta.nutritionSummary}</div>}
                            {meta.hydrationSummary && <div><span className="font-semibold text-gray-700">Fluids:</span> {meta.hydrationSummary}</div>}
                            {meta.medicationSummary && <div><span className="font-semibold text-gray-700">Meds:</span> {meta.medicationSummary}</div>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {meta.handoverFlag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ Handover Flag
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">Normal</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.attachmentUrl ? (
                            <a
                              href={r.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Open attachment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openViewModal(r)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(r.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete record"
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
            )}
          </div>
        )}
      </div>

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  {TABS.find(t => t.key === formData.logType)?.icon}
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    {isEditing ? 'Edit' : 'Log New'}{' '}
                    {formData.logType === 'FAMILY_FRIENDS' && 'Family & Friends Communication'}
                    {formData.logType === 'PROFESSIONAL' && 'Professional Multidisciplinary Contact'}
                    {formData.logType === 'DAILY_NOTES' && 'Daily Care Shift Note'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Service User: <span className="font-semibold">{serviceUserName || 'Service User'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
              {/* Type Switcher inside modal if creating new */}
              {!isEditing && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Select Communication Log Section
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            logType: t.key,
                            category: t.key === 'DAILY_NOTES' ? 'Morning Shift (AM)' : 'Telephone Call',
                            relationshipOrRole: t.key === 'FAMILY_FRIENDS' ? 'Daughter' : t.key === 'PROFESSIONAL' ? 'General Practitioner (GP)' : '',
                          }));
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          formData.logType === t.key
                            ? 'bg-blue-50 border-[#224fa6] text-[#224fa6] shadow-xs ring-1 ring-[#224fa6]'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.shortTitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* General Row: Date/Time + Staff Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={e => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Staff Member / Recorded By *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="staff-options"
                      placeholder="Type or select staff name"
                      value={formData.staffName}
                      onChange={e => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      required
                    />
                    <datalist id="staff-options">
                      {staffList.map(s => (
                        <option key={s.id} value={`${s.firstName || ''} ${s.lastName || ''}`.trim()} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 1: FAMILY & FRIENDS SPECIFIC FIELDS ================= */}
              {formData.logType === 'FAMILY_FRIENDS' && (
                <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Family & Friends Contact Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Mansell"
                        value={formData.contactName}
                        onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        value={formData.relationshipOrRole}
                        onChange={e => setFormData(prev => ({ ...prev, relationshipOrRole: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select Relationship</option>
                        {FAMILY_RELATIONSHIPS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Communication Method
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        {COMMUNICATION_METHODS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Call / Contact Direction
                      </label>
                      <div className="flex gap-3 pt-1">
                        <label className="flex items-center gap-2 text-xs text-gray-800 font-medium cursor-pointer">
                          <input
                            type="radio"
                            name="direction"
                            value="Incoming"
                            checked={formData.direction === 'Incoming'}
                            onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                            className="text-[#224fa6] focus:ring-[#224fa6]"
                          />
                          <span>Incoming (Contact called/visited)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-800 font-medium cursor-pointer">
                          <input
                            type="radio"
                            name="direction"
                            value="Outgoing"
                            checked={formData.direction === 'Outgoing'}
                            onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                            className="text-[#224fa6] focus:ring-[#224fa6]"
                          />
                          <span>Outgoing (Staff contacted family)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 2: PROFESSIONAL CONTACT FIELDS ================= */}
              {formData.logType === 'PROFESSIONAL' && (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Professional & Multidisciplinary Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Professional Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Jennifer Collins"
                        value={formData.contactName}
                        onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Profession / Role *
                      </label>
                      <select
                        value={formData.relationshipOrRole}
                        onChange={e => setFormData(prev => ({ ...prev, relationshipOrRole: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select Professional Role</option>
                        {PROFESSIONAL_ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Organisation / Surgery / Trust
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Oak Tree Surgery / NHS Trust"
                        value={formData.organization}
                        onChange={e => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Communication Method
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        {COMMUNICATION_METHODS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        <option value="Routine">Routine</option>
                        <option value="Urgent">Urgent / High Priority</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Next Review / Follow-Up Date
                      </label>
                      <input
                        type="date"
                        value={formData.followUpDate}
                        onChange={e => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 3: DAILY NOTES LOG SPECIFIC FIELDS ================= */}
              {formData.logType === 'DAILY_NOTES' && (
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Daily Shift & Well-being Indicators
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Care Shift *
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                        required
                      >
                        {SHIFTS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Observed Mood & Emotional State
                      </label>
                      <select
                        value={formData.mood}
                        onChange={e => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        {MOODS.map(m => (
                          <option key={m.value} value={m.value}>{m.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Meals & Nutrition
                      </label>
                      <select
                        value={formData.nutritionSummary}
                        onChange={e => setFormData(prev => ({ ...prev, nutritionSummary: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        <option value="Ate well / all meals">Ate well / all meals</option>
                        <option value="Ate most meals">Ate most meals</option>
                        <option value="Ate half meals">Ate half meals</option>
                        <option value="Ate little / poor appetite">Ate little / poor appetite</option>
                        <option value="Refused meals">Refused meals</option>
                        <option value="Nil by mouth / N/A">Nil by mouth / N/A</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Hydration & Fluids
                      </label>
                      <select
                        value={formData.hydrationSummary}
                        onChange={e => setFormData(prev => ({ ...prev, hydrationSummary: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        <option value="Good fluid intake (>1500ml)">Good fluid intake (&gt;1500ml)</option>
                        <option value="Adequate fluid intake (1000-1500ml)">Adequate fluid intake (1000-1500ml)</option>
                        <option value="Low fluid intake (<1000ml) - prompted">Low fluid intake (&lt;1000ml) - prompted</option>
                        <option value="Fluids encouraged repeatedly">Fluids encouraged repeatedly</option>
                        <option value="IV fluids / PEG feed">IV fluids / PEG feed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Medication Status
                      </label>
                      <select
                        value={formData.medicationSummary}
                        onChange={e => setFormData(prev => ({ ...prev, medicationSummary: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                      >
                        <option value="Administered as prescribed">Administered as prescribed</option>
                        <option value="Self-administered / prompted">Self-administered / prompted</option>
                        <option value="PRN administered">PRN administered</option>
                        <option value="Refused / omitted">Refused / omitted</option>
                        <option value="No medication due this shift">No medication due this shift</option>
                      </select>
                    </div>
                  </div>

                  {/* Handover Attention Flag */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2.5 p-2.5 bg-amber-100/70 border border-amber-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.handoverFlag}
                        onChange={e => setFormData(prev => ({ ...prev, handoverFlag: e.target.checked }))}
                        className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-950">
                        Flag this note for immediate handover attention (Next shift alert)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Shared Summary & Detailed Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Shift Summary / Key Highlights *'
                    : 'Topic / Communication Summary *'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.logType === 'FAMILY_FRIENDS'
                      ? 'e.g. Daughter enquired about weekend outing and new wheelchair prescription'
                      : formData.logType === 'PROFESSIONAL'
                      ? 'e.g. Monthly medication review with GP & blood pressure consultation'
                      : 'e.g. Cheerful morning, completed personal care with 1 staff assistance, enjoyed breakfast'
                  }
                  value={formData.summary}
                  onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Care Delivered, Activities & Full Shift Notes'
                    : 'Discussion Details & Clinical / Support Information'}
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    formData.logType === 'DAILY_NOTES'
                      ? 'Detail personal care delivered, fluid and food consumption, mobility support, emotional state, activities engaged in, and any observations.'
                      : 'Enter comprehensive notes regarding the discussion, information shared, guidance provided, or decisions reached.'
                  }
                  value={formData.details}
                  onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Handover Points / Follow-Up for Next Shift'
                    : 'Agreed Actions & Next Steps'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    formData.logType === 'DAILY_NOTES'
                      ? 'e.g. Evening staff to encourage fluid intake; watch for left ankle swelling; son visiting at 6:30pm.'
                      : 'e.g. Social worker to send amended care package by Friday; care manager to schedule follow-up call.'
                  }
                  value={formData.actions}
                  onChange={e => setFormData(prev => ({ ...prev, actions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                />
              </div>

              {/* Document / File Attachment */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Attachment / Document / Photo (Optional)
                </label>
                <FileUpload
                  label="Upload Document or Photo"
                  accept=".pdf,.doc,.docx,image/*"
                  onUploadComplete={(url) => {
                    setFormData(prev => ({ ...prev, attachmentUrl: url }));
                    if (onNotification) onNotification({ show: true, message: 'File attached successfully', type: 'success' });
                  }}
                  onError={(err) => {
                    if (onNotification) onNotification({ show: true, message: `Upload failed: ${err}`, type: 'error' });
                  }}
                />
                {formData.attachmentUrl && (
                  <div className="mt-2 flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    <span className="truncate font-medium">
                      Attached: {formData.attachmentUrl.split('/').pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, attachmentUrl: '' }))}
                      className="text-red-600 hover:text-red-800 font-semibold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white text-sm font-semibold rounded-lg hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW RECORD DETAILS MODAL ===================== */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* View Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  {TABS.find(t => t.key === selectedRecord.logType)?.icon}
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedRecord.logType === 'FAMILY_FRIENDS' && 'Family & Friends Communication'}
                    {selectedRecord.logType === 'PROFESSIONAL' && 'Professional Communication'}
                    {selectedRecord.logType === 'DAILY_NOTES' && 'Daily Care Shift Note'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Logged: {formatDateTimeDisplay(selectedRecord.dateTime)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* View Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 uppercase font-medium block">Recorded By</span>
                  <span className="font-semibold text-gray-900 text-sm">{selectedRecord.staffName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-medium block">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Shift' : 'Method'}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{selectedRecord.category || '-'}</span>
                </div>
                {selectedRecord.contactName && (
                  <div>
                    <span className="text-gray-500 uppercase font-medium block">Contact</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedRecord.contactName}</span>
                  </div>
                )}
                {selectedRecord.relationshipOrRole && (
                  <div>
                    <span className="text-gray-500 uppercase font-medium block">Role / Relationship</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedRecord.relationshipOrRole}</span>
                  </div>
                )}
                {selectedRecord.organization && (
                  <div>
                    <span className="text-gray-500 uppercase font-medium block">Organisation</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedRecord.organization}</span>
                  </div>
                )}
                {selectedRecord.metadata?.direction && (
                  <div>
                    <span className="text-gray-500 uppercase font-medium block">Direction</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedRecord.metadata.direction}</span>
                  </div>
                )}
                {selectedRecord.metadata?.mood && (
                  <div>
                    <span className="text-gray-500 uppercase font-medium block">Mood</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedRecord.metadata.mood}</span>
                  </div>
                )}
                {selectedRecord.metadata?.handoverFlag && (
                  <div className="col-span-2">
                    <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded inline-block">
                      ⚠️ Handover Flag: Requires Next Shift Attention
                    </span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  {selectedRecord.logType === 'DAILY_NOTES' ? 'Shift Summary' : 'Topic / Subject'}
                </h4>
                <p className="text-base font-semibold text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {selectedRecord.summary || '-'}
                </p>
              </div>

              {/* Details */}
              {selectedRecord.details && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Care Delivered & Shift Notes' : 'Discussion & Details'}
                  </h4>
                  <div className="text-sm text-gray-800 bg-gray-50/70 p-3.5 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedRecord.details}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRecord.actions && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Handover Points' : 'Agreed Actions & Next Steps'}
                  </h4>
                  <div className="text-sm text-gray-800 bg-blue-50/50 p-3.5 rounded-lg border border-blue-200 whitespace-pre-wrap leading-relaxed">
                    {selectedRecord.actions}
                  </div>
                </div>
              )}

              {/* Daily Shift Stats */}
              {selectedRecord.logType === 'DAILY_NOTES' && selectedRecord.metadata && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">Nutrition: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.nutritionSummary || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Hydration: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.hydrationSummary || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Medication: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.medicationSummary || '-'}</span>
                  </div>
                </div>
              )}

              {/* Attachment */}
              {selectedRecord.attachmentUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-blue-900 font-medium truncate">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate">{selectedRecord.attachmentUrl.split('/').pop()}</span>
                  </div>
                  <a
                    href={selectedRecord.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap ml-2"
                  >
                    View / Download
                  </a>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-2 text-[11px] text-gray-400 flex justify-between border-t border-gray-100">
                <span>Created: {formatDateTimeDisplay(selectedRecord.createdAt)}</span>
                <span>Updated: {formatDateTimeDisplay(selectedRecord.updatedAt)}</span>
              </div>
            </div>

            {/* View Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedRecord);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Edit Record
              </button>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-[#224fa6] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3d85] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Communication Record?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this communication record? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
