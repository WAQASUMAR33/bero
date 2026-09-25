'use client';

import { useEffect, useMemo, useState } from 'react';
import FileUpload from '../../components/FileUpload';

const TABS = [
  {
    key: 'FAMILY_FRIENDS',
    title: 'Family & Friends Communication',
    shortTitle: 'Family & Friends',
    subtitle: 'Track interactions with relatives, next of kin, friends, and legal advocates.',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBadgeColor: 'bg-white text-[#224fa6]',
    activeTheme: 'from-blue-600 to-indigo-700',
    accentColor: '#224fa6'
  },
  {
    key: 'PROFESSIONAL',
    title: 'Professional Multidisciplinary Log',
    shortTitle: 'Professional Contacts',
    subtitle: 'Record communications with GPs, Social Workers, District Nurses, OTs, and CQC.',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBadgeColor: 'bg-white text-emerald-800',
    activeTheme: 'from-emerald-600 to-teal-700',
    accentColor: '#059669'
  },
  {
    key: 'DAILY_NOTES',
    title: 'Daily Shift Care Notes',
    shortTitle: 'Daily Shift Notes',
    subtitle: 'Shift summaries, emotional well-being, nutrition/hydration, care delivered, and handovers.',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    activeBadgeColor: 'bg-white text-amber-800',
    activeTheme: 'from-amber-600 to-orange-700',
    accentColor: '#d97706'
  },
];

const FAMILY_RELATIONSHIPS = [
  'Daughter', 'Son', 'Spouse / Partner', 'Mother', 'Father', 'Sister', 'Brother',
  'Granddaughter', 'Grandson', 'Niece / Nephew', 'Power of Attorney (POA)',
  'Next of Kin', 'Close Friend', 'Advocate / Deputy', 'Other Relative'
];

const COMMUNICATION_METHODS = [
  'Telephone Call', 'In-Person Visit', 'Video Call', 'Email', 'SMS / Text Message',
  'Letter / Postal Mail', 'Home Visit', 'Review Meeting', 'MDT Meeting', 'Other'
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
  { value: 'Happy & Cheerful', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'Settled & Calm', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'Quiet & Reserved', color: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  { value: 'Anxious & Distressed', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  { value: 'Agitated / Confused', color: 'bg-orange-50 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  { value: 'Unwell / Lethargic', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
];

export default function CommunicationLogsForm({ serviceSeekerId, serviceUserName = '', onNotification }) {
  const [activeTab, setActiveTab] = useState('FAMILY_FRIENDS');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [handoverOnlyFilter, setHandoverOnlyFilter] = useState(false);

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
    if (!s) return { date: '-', time: '' };
    try {
      const d = new Date(s);
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: s || '-', time: '' };
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

  // Tab stats summary
  const tabStats = useMemo(() => {
    const currentTabRecords = records.filter(r => r.logType === activeTab);
    if (activeTab === 'FAMILY_FRIENDS') {
      const incoming = currentTabRecords.filter(r => (r.metadata?.direction || 'Incoming') === 'Incoming').length;
      const outgoing = currentTabRecords.filter(r => r.metadata?.direction === 'Outgoing').length;
      const withActions = currentTabRecords.filter(r => Boolean(r.actions?.trim())).length;
      return [
        { label: 'Total Logs', value: currentTabRecords.length, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Incoming', value: incoming, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Outgoing', value: outgoing, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Follow-ups Required', value: withActions, color: 'text-purple-700 bg-purple-50 border-purple-200' },
      ];
    } else if (activeTab === 'PROFESSIONAL') {
      const urgent = currentTabRecords.filter(r => r.metadata?.priority === 'Urgent' || r.metadata?.priority === 'Emergency').length;
      const withFollowUp = currentTabRecords.filter(r => Boolean(r.metadata?.followUpDate)).length;
      const organizations = new Set(currentTabRecords.map(r => r.organization).filter(Boolean)).size;
      return [
        { label: 'Total Contacts', value: currentTabRecords.length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Urgent / Priority', value: urgent, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'Reviews Scheduled', value: withFollowUp, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Organisations', value: organizations, color: 'text-slate-700 bg-slate-50 border-slate-200' },
      ];
    } else {
      const flagged = currentTabRecords.filter(r => Boolean(r.metadata?.handoverFlag)).length;
      const morning = currentTabRecords.filter(r => (r.category || '').includes('Morning')).length;
      const afternoon = currentTabRecords.filter(r => (r.category || '').includes('Afternoon') || (r.category || '').includes('Evening')).length;
      const night = currentTabRecords.filter(r => (r.category || '').includes('Night')).length;
      return [
        { label: 'Total Shifts', value: currentTabRecords.length, color: 'text-amber-800 bg-amber-50 border-amber-200' },
        { label: 'Handover Alerts', value: flagged, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'AM Shifts', value: morning, color: 'text-sky-700 bg-sky-50 border-sky-200' },
        { label: 'PM / Night Shifts', value: afternoon + night, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
      ];
    }
  }, [records, activeTab]);

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

      if (priorityFilter) {
        if ((r.metadata?.priority || 'Routine') !== priorityFilter) return false;
      }

      if (handoverOnlyFilter) {
        if (!r.metadata?.handoverFlag) return false;
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
        const mood = (r.metadata?.mood || '').toLowerCase();

        return (
          contact.includes(q) ||
          relOrRole.includes(q) ||
          org.includes(q) ||
          staff.includes(q) ||
          sum.includes(q) ||
          det.includes(q) ||
          act.includes(q) ||
          mood.includes(q)
        );
      }

      return true;
    });
  }, [records, activeTab, dateFilter, categoryFilter, priorityFilter, handoverOnlyFilter, searchQuery]);

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
            message: isEditing ? 'Record updated successfully.' : 'Record logged successfully.',
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

  const hasActiveFilters = Boolean(searchQuery || dateFilter || categoryFilter || priorityFilter || handoverOnlyFilter);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setHandoverOnlyFilter(false);
  };

  const activeTabConfig = TABS.find(t => t.key === activeTab) || TABS[0];

  return (
    <div className="w-full max-w-full min-w-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all duration-200">
      {/* ================= HEADER BANNER ================= */}
      <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] text-white px-5 sm:px-7 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl shadow-inner flex-shrink-0 text-white border border-white/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Communication Logs & Records</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/20">
                  {serviceUserName ? `User: ${serviceUserName}` : 'Active Service User'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Centralized registry for multidisciplinary communications, family liaisons, and daily care shift notes
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center flex-wrap gap-2.5 sm:self-auto">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 bg-black/15 backdrop-blur-sm rounded-lg border border-white/20 text-white">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#1e40af] shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
                title="Structured Table View"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'card' ? 'bg-white text-[#1e40af] shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
                title="Feed / Card Timeline View"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Primary Add Button */}
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1e40af] font-semibold text-xs sm:text-sm rounded-lg hover:bg-blue-50 shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>
                {activeTab === 'FAMILY_FRIENDS' && 'Log Family Contact'}
                {activeTab === 'PROFESSIONAL' && 'Log Professional Contact'}
                {activeTab === 'DAILY_NOTES' && 'Add Daily Shift Note'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <div className="bg-slate-50/80 border-b border-gray-200 px-4 sm:px-7 pt-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" role="tablist">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCategoryFilter('');
                  setPriorityFilter('');
                  setHandoverOnlyFilter(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-t-2 border-x cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1e40af] border-t-[#2563eb] border-x-gray-200 shadow-xs'
                    : 'bg-transparent text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <span className={isActive ? 'text-[#2563eb]' : 'text-gray-400'}>
                  {tab.icon}
                </span>
                <span>{tab.shortTitle}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full border transition-all ${
                    isActive ? tab.badgeColor : 'bg-gray-200/80 text-gray-600 border-gray-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION BODY ================= */}
      <div className="p-4 sm:p-7 space-y-6">
        {/* KPI Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tabStats.map((stat, idx) => (
            <div
              key={idx}
              className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between ${stat.color} transition-all`}
            >
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider opacity-80">
                {stat.label}
              </span>
              <span className="text-xl sm:text-2xl font-black mt-1">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Tab Description Banner */}
        <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-blue-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse"></span>
            <div>
              <span className="font-bold text-blue-950">{activeTabConfig.title}: </span>
              <span className="text-blue-800">{activeTabConfig.subtitle}</span>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 bg-white rounded-lg border border-blue-200 text-blue-800 font-semibold text-xs whitespace-nowrap shadow-2xs">
            Showing {filteredRecords.length} of {tabCounts[activeTab] || 0}
          </span>
        </div>

        {/* ================= SEARCH & FILTERS BAR ================= */}
        <div className="bg-slate-50/60 p-3.5 rounded-xl border border-gray-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {/* 1. Search Box */}
            <div className="relative xl:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTabConfig.shortTitle.toLowerCase()}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* 2. Date Filter */}
            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all text-gray-800"
                title="Filter by log date"
              />
            </div>

            {/* 3. Category / Method / Shift Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all text-gray-800"
              >
                <option value="">
                  {activeTab === 'DAILY_NOTES' ? 'All Shifts' : 'All Methods'}
                </option>
                {activeTab === 'DAILY_NOTES'
                  ? SHIFTS.map(s => <option key={s} value={s}>{s}</option>)
                  : COMMUNICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)
                }
              </select>
            </div>

            {/* 4. Quick Toggles / Clear Filter */}
            <div className="flex items-center gap-2">
              {activeTab === 'PROFESSIONAL' && (
                <button
                  type="button"
                  onClick={() => setPriorityFilter(prev => prev === 'Urgent' ? '' : 'Urgent')}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    priorityFilter === 'Urgent'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Urgent Only
                </button>
              )}

              {activeTab === 'DAILY_NOTES' && (
                <button
                  type="button"
                  onClick={() => setHandoverOnlyFilter(prev => !prev)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    handoverOnlyFilter
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Handover Alerts
                </button>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="Reset all search filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT DISPLAY ================= */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-gray-200 border-t-[#2563eb] mb-3"></div>
            <p className="text-sm font-semibold text-gray-600">Retrieving communication records...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait while log entries are synced</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-3.5 shadow-xs border border-blue-100">
              {activeTabConfig.icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              No {activeTabConfig.shortTitle} Records
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-5">
              {hasActiveFilters
                ? 'No logs matched your selected query or filters. Try clearing filters to see all entries.'
                : `Ensure compliance and seamless care continuity by recording all interactions for ${serviceUserName || 'this service user'}.`}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#224fa6] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1a3d85] transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First {activeTabConfig.shortTitle}</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* ================= CARD / FEED VIEW (100% RESPONSIVE) ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map(r => {
              const meta = r.metadata || {};
              const dt = formatDateTimeDisplay(r.dateTime);
              const moodConfig = MOODS.find(m => m.value === meta.mood) || MOODS[1];

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Tab Type Badge */}
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          {r.category || (activeTab === 'DAILY_NOTES' ? 'Shift Note' : 'Call')}
                        </span>

                        {/* Direction Badge */}
                        {activeTab !== 'DAILY_NOTES' && (
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                            meta.direction === 'Outgoing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {meta.direction === 'Outgoing' ? 'Outgoing' : 'Incoming'}
                          </span>
                        )}

                        {/* Priority Badge */}
                        {meta.priority && meta.priority !== 'Routine' && (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            {meta.priority}
                          </span>
                        )}

                        {/* Handover Flag Badge */}
                        {meta.handoverFlag && (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            Handover Alert
                          </span>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="text-right whitespace-nowrap flex-shrink-0">
                        <div className="text-xs font-bold text-gray-900">{dt.date}</div>
                        <div className="text-[11px] text-gray-500">{dt.time}</div>
                      </div>
                    </div>

                    {/* Contact or Shift Person */}
                    <div className="mt-1">
                      {activeTab === 'DAILY_NOTES' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">
                            Carer: {r.staffName || 'Staff Member'}
                          </span>
                          {meta.mood && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${moodConfig.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${moodConfig.dot}`}></span>
                              {meta.mood}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {r.contactName || (activeTab === 'FAMILY_FRIENDS' ? 'Family Member' : 'Professional Contact')}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600 flex-wrap">
                            {r.relationshipOrRole && (
                              <span className="font-medium text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {r.relationshipOrRole}
                              </span>
                            )}
                            {r.organization && (
                              <span className="text-gray-500 font-medium">
                                • {r.organization}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    {r.summary && (
                      <div className="mt-3 p-2.5 bg-slate-50/80 rounded-lg border-l-4 border-[#2563eb] text-xs sm:text-sm font-semibold text-gray-900">
                        {r.summary}
                      </div>
                    )}

                    {/* Details */}
                    {r.details && (
                      <div className="mt-2.5 text-xs text-gray-700 line-clamp-3 leading-relaxed">
                        {r.details}
                      </div>
                    )}

                    {/* Actions / Next Steps */}
                    {r.actions && (
                      <div className="mt-3 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-950">
                        <span className="font-bold">Next Steps / Action: </span>
                        <span>{r.actions}</span>
                      </div>
                    )}

                    {/* Daily Shift Status Strip */}
                    {activeTab === 'DAILY_NOTES' && meta && (
                      <div className="mt-3 grid grid-cols-3 gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-700">
                        <div className="truncate"><span className="font-bold">Meals:</span> {meta.nutritionSummary?.split('/')[0] || '-'}</div>
                        <div className="truncate"><span className="font-bold">Fluids:</span> {meta.hydrationSummary?.split('(')[0] || '-'}</div>
                        <div className="truncate"><span className="font-bold">Meds:</span> {meta.medicationSummary || '-'}</div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2 truncate">
                      <span>Logged by: <strong className="text-gray-700">{r.staffName || '-'}</strong></span>
                      {r.attachmentUrl && (
                        <a
                          href={r.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>Attachment</span>
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openViewModal(r)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="View Full Record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(r.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= STRUCTURED TABLE VIEW (CONTAINED HORIZONTAL SCROLL) ================= */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 lg:hidden">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Swipe horizontally to inspect all table columns
              </span>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className="text-blue-600 font-semibold underline cursor-pointer"
              >
                Switch to Card View
              </button>
            </div>

            {/* Container with strict boundary and smooth horizontal scrolling */}
            <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200/90 shadow-2xs bg-white">
              {/* 1. FAMILY AND FRIENDS TABLE */}
              {activeTab === 'FAMILY_FRIENDS' && (
                <table className="w-full min-w-[880px] text-left text-xs sm:text-sm text-gray-700 table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '170px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '260px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead className="bg-slate-50/95 text-slate-700 uppercase tracking-wider text-[11px] border-b border-gray-200 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Family / Contact</th>
                      <th className="py-3.5 px-4">Method & Direction</th>
                      <th className="py-3.5 px-4">Recorded By</th>
                      <th className="py-3.5 px-4">Topic & Notes</th>
                      <th className="py-3.5 px-4">Follow-Up Actions</th>
                      <th className="py-3.5 px-4 text-center">Attachment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((r, idx) => {
                      const meta = r.metadata || {};
                      const dt = formatDateTimeDisplay(r.dateTime);
                      return (
                        <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm">{dt.date}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{dt.time}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 truncate" title={r.contactName || 'Family Member'}>
                              {r.contactName || 'Family Member'}
                            </div>
                            {r.relationshipOrRole && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                                {r.relationshipOrRole}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-gray-800 text-xs">
                                {r.category || 'Telephone Call'}
                              </span>
                              <span className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                meta.direction === 'Outgoing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {meta.direction === 'Outgoing' ? 'Outgoing' : 'Incoming'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-medium text-xs">
                            {r.staffName || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 truncate" title={r.summary || ''}>
                              {r.summary || '-'}
                            </div>
                            {r.details && (
                              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={r.details}>
                                {r.details}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {r.actions ? (
                              <div className="text-xs text-gray-700 line-clamp-2" title={r.actions}>
                                {r.actions}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.attachmentUrl ? (
                              <a
                                href={r.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Open attached document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openViewModal(r)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
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
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(r.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
                <table className="w-full min-w-[960px] text-left text-xs sm:text-sm text-gray-700 table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: '125px' }} />
                    <col style={{ width: '175px' }} />
                    <col style={{ width: '155px' }} />
                    <col style={{ width: '135px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '230px' }} />
                    <col style={{ width: '170px' }} />
                    <col style={{ width: '85px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead className="bg-slate-50/95 text-slate-700 uppercase tracking-wider text-[11px] border-b border-gray-200 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Professional & Role</th>
                      <th className="py-3.5 px-4">Organisation / Surgery</th>
                      <th className="py-3.5 px-4">Method & Priority</th>
                      <th className="py-3.5 px-4">Recorded By</th>
                      <th className="py-3.5 px-4">Subject & Details</th>
                      <th className="py-3.5 px-4">Agreed Actions & Review</th>
                      <th className="py-3.5 px-4 text-center">Attachment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((r, idx) => {
                      const meta = r.metadata || {};
                      const dt = formatDateTimeDisplay(r.dateTime);
                      return (
                        <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm">{dt.date}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{dt.time}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 truncate" title={r.contactName || 'Healthcare Professional'}>
                              {r.contactName || 'Healthcare Professional'}
                            </div>
                            {r.relationshipOrRole && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 truncate max-w-full">
                                {r.relationshipOrRole}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {r.organization ? (
                              <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 line-clamp-1" title={r.organization}>
                                {r.organization}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-gray-800 truncate">{r.category || 'MDT Meeting'}</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  meta.direction === 'Outgoing' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {meta.direction === 'Outgoing' ? 'Out' : 'In'}
                                </span>
                                {meta.priority === 'Urgent' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-medium text-xs">
                            {r.staffName || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 truncate" title={r.summary || ''}>
                              {r.summary || '-'}
                            </div>
                            {r.details && (
                              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={r.details}>
                                {r.details}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {r.actions ? (
                              <div className="text-xs text-gray-700 line-clamp-2" title={r.actions}>
                                {r.actions}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                            {meta.followUpDate && (
                              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                                Review: {formatDateDisplay(meta.followUpDate)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.attachmentUrl ? (
                              <a
                                href={r.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Open attached document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openViewModal(r)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
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
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(r.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
                <table className="w-full min-w-[960px] text-left text-xs sm:text-sm text-gray-700 table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: '125px' }} />
                    <col style={{ width: '135px' }} />
                    <col style={{ width: '125px' }} />
                    <col style={{ width: '135px' }} />
                    <col style={{ width: '230px' }} />
                    <col style={{ width: '175px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '95px' }} />
                  </colgroup>
                  <thead className="bg-slate-50/95 text-slate-700 uppercase tracking-wider text-[11px] border-b border-gray-200 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Shift</th>
                      <th className="py-3.5 px-4">Carer / Staff</th>
                      <th className="py-3.5 px-4">Mood</th>
                      <th className="py-3.5 px-4">Care Highlights & Summary</th>
                      <th className="py-3.5 px-4">Nutrition & Fluids</th>
                      <th className="py-3.5 px-4 text-center">Handover Flag</th>
                      <th className="py-3.5 px-4 text-center">Attachment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((r, idx) => {
                      const meta = r.metadata || {};
                      const dt = formatDateTimeDisplay(r.dateTime);
                      const moodConfig = MOODS.find(m => m.value === meta.mood) || MOODS[1];
                      return (
                        <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm">{dt.date}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{dt.time}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-full">
                              {r.category || 'Morning Shift'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-gray-800 font-semibold text-xs">
                            {r.staffName || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {meta.mood ? (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${moodConfig.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${moodConfig.dot}`}></span>
                                <span className="truncate">{meta.mood}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 truncate" title={r.summary || ''}>
                              {r.summary || '-'}
                            </div>
                            {r.details && (
                              <div className="text-xs text-gray-600 line-clamp-1 mt-0.5" title={r.details}>
                                {r.details}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div className="flex flex-col gap-0.5 text-gray-600 text-[11px]">
                              {meta.nutritionSummary && <div className="truncate"><span className="font-bold text-gray-700">Meals:</span> {meta.nutritionSummary}</div>}
                              {meta.hydrationSummary && <div className="truncate"><span className="font-bold text-gray-700">Fluids:</span> {meta.hydrationSummary}</div>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {meta.handoverFlag ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Alert
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">Normal</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.attachmentUrl ? (
                              <a
                                href={r.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openViewModal(r)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
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
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(r.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
          </div>
        )}
      </div>

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] text-white px-5 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white/15 rounded-lg border border-white/20">
                  {TABS.find(t => t.key === formData.logType)?.icon}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {isEditing ? 'Edit Communication Record' : 'Create New Communication Record'}
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
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Type Switcher inside modal if creating new */}
              {!isEditing && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Log Category
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
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                          formData.logType === t.key
                            ? 'bg-blue-50 border-[#2563eb] text-[#1e40af] shadow-xs ring-1 ring-[#2563eb]'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={formData.logType === t.key ? 'text-[#2563eb]' : 'text-gray-400'}>
                          {t.icon}
                        </span>
                        <span>{t.shortTitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* General Row: Date/Time + Staff Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={e => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Staff Member / Recorded By *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="staff-options"
                      placeholder="Enter or pick staff member"
                      value={formData.staffName}
                      onChange={e => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Family & Friends Contact Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={formData.contactName}
                        onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                      >
                        {COMMUNICATION_METHODS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Call / Contact Direction
                    </label>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs text-gray-800 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="direction"
                          value="Incoming"
                          checked={formData.direction === 'Incoming'}
                          onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                          className="text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span>Incoming (Family member reached out)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-800 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="direction"
                          value="Outgoing"
                          checked={formData.direction === 'Outgoing'}
                          onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                          className="text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span>Outgoing (Staff contacted family)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 2: PROFESSIONAL CONTACT FIELDS ================= */}
              {formData.logType === 'PROFESSIONAL' && (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 3: DAILY NOTES LOG SPECIFIC FIELDS ================= */}
              {formData.logType === 'DAILY_NOTES' && (
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
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
                    <label className="flex items-center gap-2.5 p-2.5 bg-amber-100/80 border border-amber-200 rounded-lg cursor-pointer">
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
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Shift Summary / Key Highlights *'
                    : 'Topic / Communication Summary *'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.logType === 'FAMILY_FRIENDS'
                      ? 'e.g. Daughter called regarding weekend visit and medication collection'
                      : formData.logType === 'PROFESSIONAL'
                      ? 'e.g. GP monthly review of blood pressure and revised prescription'
                      : 'e.g. Settled morning, completed personal care with 1 carer, enjoyed breakfast'
                  }
                  value={formData.summary}
                  onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Care Delivered, Activities & Full Shift Notes'
                    : 'Discussion Details & Clinical / Support Information'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    formData.logType === 'DAILY_NOTES'
                      ? 'Detail care delivered, fluid and food consumption, mobility support, emotional state, activities engaged in, and observations.'
                      : 'Enter comprehensive notes regarding the discussion, information shared, guidance provided, or decisions reached.'
                  }
                  value={formData.details}
                  onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {formData.logType === 'DAILY_NOTES'
                    ? 'Handover Points / Follow-Up for Next Shift'
                    : 'Agreed Actions & Next Steps'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    formData.logType === 'DAILY_NOTES'
                      ? 'e.g. Evening staff to encourage hydration; watch for left ankle swelling.'
                      : 'e.g. Social worker to send amended care plan; manager to schedule review call.'
                  }
                  value={formData.actions}
                  onChange={e => setFormData(prev => ({ ...prev, actions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
                />
              </div>

              {/* Document / File Attachment */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
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
                      className="text-rose-600 hover:text-rose-800 font-semibold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#1e40af] to-[#2563eb] text-white text-xs sm:text-sm font-semibold rounded-lg hover:from-[#1e3a8a] hover:to-[#1d4ed8] disabled:opacity-50 transition-all shadow-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* View Header */}
            <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] text-white px-5 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white/15 rounded-lg border border-white/20">
                  {TABS.find(t => t.key === selectedRecord.logType)?.icon}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {selectedRecord.logType === 'FAMILY_FRIENDS' && 'Family & Friends Communication'}
                    {selectedRecord.logType === 'PROFESSIONAL' && 'Professional Communication'}
                    {selectedRecord.logType === 'DAILY_NOTES' && 'Daily Care Shift Note'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Logged: {formatDateDisplay(selectedRecord.dateTime)} at {formatDateTimeDisplay(selectedRecord.dateTime).time}
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
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 uppercase font-semibold block text-[10px]">Recorded By</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.staffName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-semibold block text-[10px]">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Shift' : 'Method'}
                  </span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.category || '-'}</span>
                </div>
                {selectedRecord.contactName && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Contact Person</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.contactName}</span>
                  </div>
                )}
                {selectedRecord.relationshipOrRole && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Role / Relationship</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.relationshipOrRole}</span>
                  </div>
                )}
                {selectedRecord.organization && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Organisation</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.organization}</span>
                  </div>
                )}
                {selectedRecord.metadata?.direction && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Direction</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.metadata.direction}</span>
                  </div>
                )}
                {selectedRecord.metadata?.mood && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Observed Mood</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{selectedRecord.metadata.mood}</span>
                  </div>
                )}
                {selectedRecord.metadata?.priority && selectedRecord.metadata.priority !== 'Routine' && (
                  <div>
                    <span className="text-gray-500 uppercase font-semibold block text-[10px]">Priority</span>
                    <span className="font-bold text-rose-700 text-xs sm:text-sm">{selectedRecord.metadata.priority}</span>
                  </div>
                )}
                {selectedRecord.metadata?.handoverFlag && (
                  <div className="col-span-2">
                    <span className="text-amber-900 font-bold bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md inline-block">
                      Handover Flag: Requires Immediate Next Shift Attention
                    </span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  {selectedRecord.logType === 'DAILY_NOTES' ? 'Shift Summary' : 'Topic / Subject'}
                </h4>
                <p className="text-sm sm:text-base font-bold text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {selectedRecord.summary || '-'}
                </p>
              </div>

              {/* Details */}
              {selectedRecord.details && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Care Delivered & Shift Notes' : 'Discussion & Clinical Notes'}
                  </h4>
                  <div className="text-xs sm:text-sm text-gray-800 bg-slate-50/70 p-3.5 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedRecord.details}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRecord.actions && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {selectedRecord.logType === 'DAILY_NOTES' ? 'Handover Points' : 'Agreed Actions & Next Steps'}
                  </h4>
                  <div className="text-xs sm:text-sm text-gray-800 bg-amber-50/60 p-3.5 rounded-lg border border-amber-200 whitespace-pre-wrap leading-relaxed">
                    {selectedRecord.actions}
                  </div>
                </div>
              )}

              {/* Daily Shift Stats */}
              {selectedRecord.logType === 'DAILY_NOTES' && selectedRecord.metadata && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-gray-700">Nutrition: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.nutritionSummary || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Hydration: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.hydrationSummary || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Medication: </span>
                    <span className="text-gray-900">{selectedRecord.metadata.medicationSummary || '-'}</span>
                  </div>
                </div>
              )}

              {/* Attachment */}
              {selectedRecord.attachmentUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold truncate">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate">{selectedRecord.attachmentUrl.split('/').pop()}</span>
                  </div>
                  <a
                    href={selectedRecord.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-[#2563eb] text-white rounded text-xs font-semibold hover:bg-[#1d4ed8] transition-colors whitespace-nowrap ml-2"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>

            {/* View Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedRecord);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Edit Record
              </button>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-[#2563eb] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">Delete Communication Record?</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-5">
              Are you sure you want to permanently delete this communication entry? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
