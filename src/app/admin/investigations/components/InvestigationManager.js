'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  FileText, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Download, 
  Search, 
  X, 
  Calendar, 
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';
import InvestigationNavTabs from './InvestigationNavTabs';

const AREA_OPTIONS = [
  'Accident',
  'Incident',
  'Complaint',
  'Concern',
  'Safeguarding',
  'CQC',
  'Grievance',
  'Other'
];

const PROGRESS_OPTIONS = [
  'Not Started',
  'In Progress',
  'Completed'
];

const LESSONS_LEARNT_OPTIONS = [
  'Yes',
  'No',
  'N/A'
];

export default function InvestigationManager({ title = 'Internal Investigations & Audits' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'In Progress', 'Not Started', 'Completed'
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ total: 0, inProgress: 0, notStarted: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for all 11 columns
  const initialForm = {
    id: null,
    dateOfIncident: new Date().toISOString().split('T')[0],
    dateInvestigationCommenced: new Date().toISOString().split('T')[0],
    personsInvolved: '',
    areaBeingInvestigated: 'Incident',
    briefOverview: '',
    actionsTaken: '',
    outcome: '',
    progress: 'Not Started',
    dateCompleted: '',
    lessonsLearnt: 'N/A',
    comments: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  // Sync tab from URL search parameters if provided
  useEffect(() => {
    const progressParam = searchParams.get('progress');
    if (progressParam && ['ALL', 'In Progress', 'Not Started', 'Completed'].includes(progressParam)) {
      setActiveTab(progressParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location);
    if (tabId === 'ALL') {
      url.searchParams.delete('progress');
    } else {
      url.searchParams.set('progress', tabId);
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, activeTab, areaFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('progress', activeTab);
      if (areaFilter !== 'ALL') params.append('area', areaFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/investigations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setRecords(result.data || []);
        setCounts(result.counts || { total: 0, inProgress: 0, notStarted: 0, completed: 0 });
      } else {
        showNotification(result.error || 'Failed to fetch investigations', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading investigations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (e) => {
    if (e) e.preventDefault();
    if (!formData.areaBeingInvestigated?.trim()) {
      showNotification('Area Being Investigated is required', 'error');
      return;
    }
    if (!formData.briefOverview?.trim()) {
      showNotification('Brief Overview of the investigation is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/investigations/${formData.id}` : '/api/investigations';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (result.success) {
        showNotification(
          isEditing ? 'Investigation updated successfully' : 'Investigation registered successfully',
          'success'
        );
        setShowFormModal(false);
        resetForm();
        fetchRecords();
      } else {
        showNotification(result.error || 'Failed to save investigation', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error processing investigation request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickProgressUpdate = async (recordId, newProgress) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/investigations/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ progress: newProgress })
      });
      const result = await res.json();
      if (result.success) {
        showNotification(`Investigation status updated to ${newProgress}`, 'success');
        fetchRecords();
      } else {
        showNotification(result.error || 'Failed to update progress', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error updating progress', 'error');
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteConfirmId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/investigations/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Investigation deleted successfully', 'success');
        setDeleteConfirmId(null);
        fetchRecords();
      } else {
        showNotification(result.error || 'Failed to delete investigation', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting investigation', 'error');
    }
  };

  const openEditModal = (rec) => {
    setFormData({
      id: rec.id,
      dateOfIncident: rec.dateOfIncident ? new Date(rec.dateOfIncident).toISOString().split('T')[0] : '',
      dateInvestigationCommenced: rec.dateInvestigationCommenced ? new Date(rec.dateInvestigationCommenced).toISOString().split('T')[0] : '',
      personsInvolved: rec.personsInvolved || '',
      areaBeingInvestigated: rec.areaBeingInvestigated || 'Incident',
      briefOverview: rec.briefOverview || '',
      actionsTaken: rec.actionsTaken || '',
      outcome: rec.outcome || '',
      progress: rec.progress || 'Not Started',
      dateCompleted: rec.dateCompleted ? new Date(rec.dateCompleted).toISOString().split('T')[0] : '',
      lessonsLearnt: rec.lessonsLearnt || 'N/A',
      comments: rec.comments || ''
    });
    setShowFormModal(true);
  };

  const openDetailModal = (rec) => {
    setSelectedRecord(rec);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData(initialForm);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(34, 79, 166);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('INTERNAL INVESTIGATION TRACKER REPORT', 14, 15);

      // Meta Information
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(240, 240, 240);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} | Scope: ${activeTab.toUpperCase()}`, pageWidth - 14, 15, { align: 'right' });

      // Table Generation
      const tableData = filteredRecords.map(item => [
        `INV-${String(item.id).padStart(4, '0')}`,
        item.dateOfIncident ? new Date(item.dateOfIncident).toLocaleDateString('en-GB') : '-',
        item.areaBeingInvestigated || '-',
        item.personsInvolved || '-',
        (item.briefOverview || '').substring(0, 75) + ((item.briefOverview?.length || 0) > 75 ? '...' : ''),
        (item.actionsTaken || '').substring(0, 60) + ((item.actionsTaken?.length || 0) > 60 ? '...' : ''),
        item.progress || 'Not Started',
        item.dateCompleted ? new Date(item.dateCompleted).toLocaleDateString('en-GB') : '-',
        item.lessonsLearnt || 'N/A'
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Ref ID', 'Incident Date', 'Area', 'Persons Involved', 'Overview', 'Actions Taken', 'Progress', 'Date Completed', 'Lessons']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [34, 79, 166], textColor: 255, fontStyle: 'bold' }
      });

      doc.save(`Investigation_Tracker_${activeTab.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      showNotification('Report exported to PDF successfully', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to export PDF', 'error');
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(r => (
      (r.personsInvolved && r.personsInvolved.toLowerCase().includes(term)) ||
      (r.areaBeingInvestigated && r.areaBeingInvestigated.toLowerCase().includes(term)) ||
      (r.briefOverview && r.briefOverview.toLowerCase().includes(term)) ||
      (r.actionsTaken && r.actionsTaken.toLowerCase().includes(term)) ||
      (r.outcome && r.outcome.toLowerCase().includes(term)) ||
      (r.comments && r.comments.toLowerCase().includes(term))
    ));
  }, [records, searchTerm]);

  const getAreaBadgeClass = (area) => {
    switch (area) {
      case 'Safeguarding':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Incident':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accident':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Complaint':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Concern':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'CQC':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Grievance':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressBadgeClass = (prog) => {
    switch (prog) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Not Started':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLessonsBadgeClass = (val) => {
    switch (val) {
      case 'Yes':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'No':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ ...notification, show: false })}
            />
          )}

          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#224fa6] text-white flex items-center justify-center shadow-xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                    {title}
                  </h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                    Live investigation register for incidents, accidents, safeguarding concerns, complaints, and clinical oversight.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/admin/kpi')}
                  className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-[#224fa6]" />
                  <span>KPI & Evaluations</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowFormModal(true); }}
                  className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>New Investigation</span>
                </button>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="mt-6">
              <InvestigationNavTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                counts={counts}
              />
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">In Progress</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.inProgress}</p>
                <span className="text-[11px] text-gray-400">Active investigations underway</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Not Started</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.notStarted}</p>
                <span className="text-[11px] text-gray-400">Awaiting commencement</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.completed}</p>
                <span className="text-[11px] text-gray-400">Signed off and resolved</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Total Registered</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.total}</p>
                <span className="text-[11px] text-gray-400">All recorded investigations</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by persons involved, area, overview, actions, outcome, comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Area:</span>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-hidden focus:border-[#224fa6]"
                >
                  <option value="ALL">All Categories</option>
                  {AREA_OPTIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {(searchTerm || areaFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setAreaFilter('ALL'); }}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Ref & Incident Date</th>
                    <th className="py-3 px-4">Category & Persons</th>
                    <th className="py-3 px-4">Brief Overview</th>
                    <th className="py-3 px-4">Actions Taken & Outcome</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4 text-center">Lessons</th>
                    <th className="py-3 px-4">Progress Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#224fa6] border-t-transparent rounded-full animate-spin" />
                          <span>Loading investigations...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="font-semibold text-gray-700">No investigations found</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {searchTerm || areaFilter !== 'ALL' || activeTab !== 'ALL'
                              ? 'Try adjusting your search or category filters.'
                              : 'Click "New Investigation" to record a case.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Ref & Incident Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-gray-900">
                              INV-{String(item.id).padStart(4, '0')}
                            </span>
                            <span className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {item.dateOfIncident ? new Date(item.dateOfIncident).toLocaleDateString('en-GB') : 'Not specified'}
                            </span>
                          </div>
                        </td>

                        {/* Category & Persons */}
                        <td className="py-3.5 px-4 min-w-[160px]">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border w-fit ${getAreaBadgeClass(item.areaBeingInvestigated)}`}>
                              {item.areaBeingInvestigated}
                            </span>
                            <span className="text-gray-800 font-medium line-clamp-1">
                              {item.personsInvolved || 'No persons recorded'}
                            </span>
                          </div>
                        </td>

                        {/* Overview */}
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <p className="text-gray-700 line-clamp-2 leading-relaxed">
                            {item.briefOverview || 'No description entered'}
                          </p>
                          <button
                            type="button"
                            onClick={() => openDetailModal(item)}
                            className="text-[#224fa6] hover:underline text-[11px] font-semibold mt-0.5 inline-block cursor-pointer"
                          >
                            Read more
                          </button>
                        </td>

                        {/* Actions Taken & Outcome */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="flex flex-col gap-1">
                            {item.actionsTaken && (
                              <p className="text-gray-600 line-clamp-1">
                                <span className="font-semibold text-gray-800">Action:</span> {item.actionsTaken}
                              </p>
                            )}
                            {item.outcome && (
                              <p className="text-gray-600 line-clamp-1">
                                <span className="font-semibold text-gray-800">Outcome:</span> {item.outcome}
                              </p>
                            )}
                            {!item.actionsTaken && !item.outcome && (
                              <span className="text-gray-400 text-[11px]">Pending action review</span>
                            )}
                          </div>
                        </td>

                        {/* Timeline */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col text-[11px] text-gray-600">
                            <span>
                              <span className="font-semibold text-gray-700">Commenced:</span>{' '}
                              {item.dateInvestigationCommenced ? new Date(item.dateInvestigationCommenced).toLocaleDateString('en-GB') : '-'}
                            </span>
                            <span>
                              <span className="font-semibold text-gray-700">Completed:</span>{' '}
                              {item.dateCompleted ? new Date(item.dateCompleted).toLocaleDateString('en-GB') : 'Pending'}
                            </span>
                          </div>
                        </td>

                        {/* Lessons Learnt */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLessonsBadgeClass(item.lessonsLearnt)}`}>
                            {item.lessonsLearnt || 'N/A'}
                          </span>
                        </td>

                        {/* Progress Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={item.progress || 'Not Started'}
                            onChange={(e) => handleQuickProgressUpdate(item.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-hidden ${getProgressBadgeClass(item.progress)}`}
                          >
                            {PROGRESS_OPTIONS.map(opt => (
                              <option key={opt} value={opt} className="bg-white text-gray-800 font-medium">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetailModal(item)}
                              title="View details"
                              className="p-1.5 text-gray-500 hover:text-[#224fa6] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              title="Edit investigation"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              title="Delete record"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredRecords.length} of {counts.total} investigations</span>
              <span className="font-medium">Confidential Internal Records</span>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#224fa6] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5" />
                <h3 className="font-bold text-lg">
                  {formData.id ? `Edit Investigation (INV-${String(formData.id).padStart(4, '0')})` : 'New Investigation Case'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Date Of Incident */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Date Of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfIncident}
                    onChange={(e) => setFormData({ ...formData, dateOfIncident: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 2. Date Investigation Commenced */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Date Investigation Commenced
                  </label>
                  <input
                    type="date"
                    value={formData.dateInvestigationCommenced}
                    onChange={(e) => setFormData({ ...formData, dateInvestigationCommenced: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 3. Persons Involved */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Person's Involved
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arthur Pendelton (Resident), Sarah Jenkins (Care Assistant)"
                    value={formData.personsInvolved}
                    onChange={(e) => setFormData({ ...formData, personsInvolved: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 4. Area Being Investigated */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Area Being Investigated <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.areaBeingInvestigated}
                    onChange={(e) => setFormData({ ...formData, areaBeingInvestigated: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs font-medium"
                  >
                    {AREA_OPTIONS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* 8. Progress */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Progress Status
                  </label>
                  <select
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs font-medium"
                  >
                    {PROGRESS_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Brief Overview */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Brief Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Clear description of the event, incident, or concern being investigated..."
                    value={formData.briefOverview}
                    onChange={(e) => setFormData({ ...formData, briefOverview: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 6. Actions Taken */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Actions Taken
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Immediate clinical/management actions, risk mitigation, interviews conducted..."
                    value={formData.actionsTaken}
                    onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 7. Outcome */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Outcome
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Findings, disciplinary or remedial actions, conclusion of the inquiry..."
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 9. Date Completed */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Date Completed
                  </label>
                  <input
                    type="date"
                    value={formData.dateCompleted}
                    onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>

                {/* 10. Lessons Learnt */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Lessons Learnt
                  </label>
                  <select
                    value={formData.lessonsLearnt}
                    onChange={(e) => setFormData({ ...formData, lessonsLearnt: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs font-medium"
                  >
                    {LESSONS_LEARNT_OPTIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* 11. Comments */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Comments & Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Clinical lead remarks, follow-up deadlines, CQC/Local Authority references..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6]/20 focus:border-[#224fa6] outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{formData.id ? 'Save Changes' : 'Register Investigation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 flex flex-col">
            <div className="bg-[#224fa6] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-white/80 uppercase">
                  Investigation Record
                </span>
                <h3 className="font-bold text-lg">
                  INV-{String(selectedRecord.id).padStart(4, '0')} - {selectedRecord.areaBeingInvestigated}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Badge & Dates Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Category</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedRecord.areaBeingInvestigated}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Progress</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedRecord.progress}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Incident Date</span>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {selectedRecord.dateOfIncident ? new Date(selectedRecord.dateOfIncident).toLocaleDateString('en-GB') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Lessons Learnt</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedRecord.lessonsLearnt || 'N/A'}</p>
                </div>
              </div>

              {/* Persons Involved */}
              <div>
                <span className="font-bold text-gray-900 block mb-1 text-xs uppercase tracking-wide">
                  Person's Involved
                </span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 leading-relaxed font-medium">
                  {selectedRecord.personsInvolved || 'None recorded'}
                </p>
              </div>

              {/* Brief Overview */}
              <div>
                <span className="font-bold text-gray-900 block mb-1 text-xs uppercase tracking-wide">
                  Brief Overview
                </span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.briefOverview || 'No description provided'}
                </p>
              </div>

              {/* Actions Taken */}
              <div>
                <span className="font-bold text-gray-900 block mb-1 text-xs uppercase tracking-wide">
                  Actions Taken
                </span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.actionsTaken || 'No action notes logged'}
                </p>
              </div>

              {/* Outcome */}
              <div>
                <span className="font-bold text-gray-900 block mb-1 text-xs uppercase tracking-wide">
                  Outcome & Findings
                </span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.outcome || 'Investigation has not reached a final outcome'}
                </p>
              </div>

              {/* Timeline Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Commenced Date</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedRecord.dateInvestigationCommenced ? new Date(selectedRecord.dateInvestigationCommenced).toLocaleDateString('en-GB') : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Completion Date</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedRecord.dateCompleted ? new Date(selectedRecord.dateCompleted).toLocaleDateString('en-GB') : 'Ongoing'}
                  </p>
                </div>
              </div>

              {/* Comments */}
              {selectedRecord.comments && (
                <div>
                  <span className="font-bold text-gray-900 block mb-1 text-xs uppercase tracking-wide">
                    Manager Comments & Notes
                  </span>
                  <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedRecord.comments}
                  </p>
                </div>
              )}

              {/* Actions Button in detail */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowDetailModal(false); openEditModal(selectedRecord); }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Investigation Record?</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Are you sure you want to delete investigation <span className="font-mono font-bold text-gray-800">INV-{String(deleteConfirmId).padStart(4, '0')}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
