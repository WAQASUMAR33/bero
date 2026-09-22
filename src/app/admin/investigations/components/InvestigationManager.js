'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  FileSearch, 
  Activity, 
  PauseCircle, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Download, 
  Search, 
  X, 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCheck, 
  Edit3, 
  Trash2, 
  UserCheck, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';
import InvestigationNavTabs from './InvestigationNavTabs';

export default function InvestigationManager({ title = 'Investigations & Referrals' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('LIVE'); // 'ALL', 'LIVE', 'HELD', 'CLOSED'
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ live: 0, held: 0, closed: 0, total: 0 });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecordForConvert, setSelectedRecordForConvert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertOptions, setConvertOptions] = useState({
    title: 'Client',
    status: 'PRE_ADMISSION',
  });

  // Form state matching Excel columns
  const [formData, setFormData] = useState({
    id: null,
    property: '',
    potentialResidentName: '',
    dateReceived: new Date().toISOString().split('T')[0],
    referralRoute: '',
    needs: '',
    hoursAllocatedPerDay: '',
    costingProposed: '',
    referer: '',
    refererContactDetails: '',
    status: 'LIVE',
    accepted: false,
    admittedDate: '',
    notes: '',
  });

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
    const tabParam = searchParams.get('tab');
    if (tabParam && ['ALL', 'LIVE', 'HELD', 'CLOSED'].includes(tabParam.toUpperCase())) {
      setActiveTab(tabParam.toUpperCase());
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location);
    if (tabId === 'ALL') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, activeTab, propertyFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('status', activeTab);
      if (propertyFilter !== 'all') params.append('property', propertyFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/enquiries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setRecords(result.data.enquiries || []);
        setCounts(result.data.counts || { live: 0, held: 0, closed: 0, total: 0 });
        setProperties(result.data.properties || []);
      } else {
        showNotification(result.error || 'Failed to fetch records', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!formData.potentialResidentName?.trim()) {
      showNotification('Resident / Candidate name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/enquiries/${formData.id}` : '/api/enquiries';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (json.success) {
        showNotification(isEditing ? 'Case record updated successfully' : 'New investigation case created', 'success');
        setShowAddModal(false);
        resetForm();
        fetchRecords();
      } else {
        showNotification(json.error || 'Failed to save record', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error saving case record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (recordId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showNotification(`Status updated to ${newStatus}`, 'success');
        fetchRecords();
      } else {
        showNotification(json.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error updating status', 'error');
    }
  };

  const handleConvertToServiceUser = async () => {
    if (!selectedRecordForConvert) return;
    setConverting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${selectedRecordForConvert.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: convertOptions.title || 'Client',
          status: convertOptions.status || 'PRE_ADMISSION'
        })
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message || 'Successfully converted to Service User', 'success');
        setSelectedRecordForConvert(null);
        fetchRecords();
      } else {
        showNotification(json.error || 'Failed to convert case', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error during conversion', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this case record? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        showNotification('Case record deleted', 'success');
        fetchRecords();
      } else {
        showNotification(json.error || 'Failed to delete record', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error deleting record', 'error');
    }
  };

  const openEditModal = (rec) => {
    setFormData({
      id: rec.id,
      property: rec.property || '',
      potentialResidentName: rec.potentialResidentName || '',
      dateReceived: rec.dateReceived ? new Date(rec.dateReceived).toISOString().split('T')[0] : '',
      referralRoute: rec.referralRoute || '',
      needs: rec.needs || '',
      hoursAllocatedPerDay: rec.hoursAllocatedPerDay || '',
      costingProposed: rec.costingProposed || '',
      referer: rec.referer || '',
      refererContactDetails: rec.refererContactDetails || '',
      status: rec.status || 'LIVE',
      accepted: Boolean(rec.accepted),
      admittedDate: rec.admittedDate ? new Date(rec.admittedDate).toISOString().split('T')[0] : '',
      notes: rec.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      property: '',
      potentialResidentName: '',
      dateReceived: new Date().toISOString().split('T')[0],
      referralRoute: '',
      needs: '',
      hoursAllocatedPerDay: '',
      costingProposed: '',
      referer: '',
      refererContactDetails: '',
      status: activeTab === 'ALL' ? 'LIVE' : activeTab,
      accepted: false,
      admittedDate: '',
      notes: '',
    });
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.setTextColor(34, 79, 166);
      doc.text(`Investigations & Enquiries Report (${activeTab} Pipeline)`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${filteredRecords.length}`, 14, 22);

      const tableData = filteredRecords.map(e => [
        e.property || '—',
        e.potentialResidentName,
        e.dateReceived ? new Date(e.dateReceived).toLocaleDateString('en-GB') : '—',
        e.referralRoute || '—',
        e.hoursAllocatedPerDay ? `${e.hoursAllocatedPerDay} hrs` : '—',
        e.costingProposed ? `£${e.costingProposed}` : '—',
        e.referer || '—',
        e.status,
        e.accepted ? 'Yes' : 'No'
      ]);

      doc.autoTable({
        startY: 26,
        head: [['Property', 'Resident / Candidate', 'Date Received', 'Referral Route', 'Hours / Day', 'Costing (£)', 'Referrer', 'Status', 'Accepted']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [34, 79, 166], textColor: 255, fontStyle: 'bold' }
      });

      doc.save(`Investigations_Report_${activeTab}_${Date.now()}.pdf`);
      showNotification('Report exported to PDF successfully', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to export PDF', 'error');
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(e => (
      (e.potentialResidentName && e.potentialResidentName.toLowerCase().includes(term)) ||
      (e.property && e.property.toLowerCase().includes(term)) ||
      (e.referer && e.referer.toLowerCase().includes(term)) ||
      (e.referralRoute && e.referralRoute.toLowerCase().includes(term)) ||
      (e.needs && e.needs.toLowerCase().includes(term))
    ));
  }, [records, searchTerm]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {notification.show && (
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, show: false })} />
          )}

          {/* Top Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#224fa6] text-white flex items-center justify-center shadow-sm">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                      {title}
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                      Intake investigation tracker, active referral pipelines, property assessments, and service user admission workflow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
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
                  onClick={() => { resetForm(); setShowAddModal(true); }}
                  className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>New Case</span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="mt-6">
              <InvestigationNavTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                counts={counts}
              />
            </div>
          </div>

          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Live Active Cases</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.live}</p>
                <span className="text-[11px] text-gray-400">Under active evaluation</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Held / Pending Cases</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.held}</p>
                <span className="text-[11px] text-gray-400">Awaiting funding / decisions</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <PauseCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Closed & Admitted</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.closed}</p>
                <span className="text-[11px] text-gray-400">Converted or resolved</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Total Registered</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{counts.total}</p>
                <span className="text-[11px] text-gray-400">Lifetime volume logged</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search resident, referrer, route, or property..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:bg-white text-gray-900"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Property:
                </span>
                <select
                  value={propertyFilter}
                  onChange={e => setPropertyFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-[#224fa6] cursor-pointer"
                >
                  <option value="all">All Properties</option>
                  {properties.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cases Data Table matching Enquiry Tracker.xlsx */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 mt-2 font-medium">Loading case records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mt-3">No investigation records found</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  There are no referrals or cases matching the selected filter ({activeTab}). Click "New Case" to register an enquiry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-3.5">Property</th>
                      <th className="py-3.5 px-4">Resident / Candidate</th>
                      <th className="py-3.5 px-3">Date Received</th>
                      <th className="py-3.5 px-3">Referral Route</th>
                      <th className="py-3.5 px-4">Care Needs Summary</th>
                      <th className="py-3.5 px-3">Hours / Day</th>
                      <th className="py-3.5 px-3">Costing</th>
                      <th className="py-3.5 px-3">Referrer & Agency</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-3">Accepted</th>
                      <th className="py-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map(rec => {
                      let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      if (rec.status === 'HELD') statusBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                      else if (rec.status === 'CLOSED') statusBadge = 'bg-gray-100 text-gray-800 border-gray-200';

                      return (
                        <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-3.5 whitespace-nowrap font-medium text-gray-800">
                            {rec.property ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {rec.property}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Not Assigned</span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-bold text-gray-900 text-sm">{rec.potentialResidentName}</p>
                            {rec.serviceSeekerId && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 mt-0.5">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                Service User #{rec.serviceSeekerId}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                            {rec.dateReceived ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {new Date(rec.dateReceived).toLocaleDateString('en-GB')}
                              </span>
                            ) : '—'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                            {rec.referralRoute || '—'}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-gray-600 line-clamp-2 leading-relaxed">
                              {rec.needs || '—'}
                            </p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap font-semibold text-gray-800">
                            {rec.hoursAllocatedPerDay ? `${rec.hoursAllocatedPerDay} hrs` : '—'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-900">
                            {rec.costingProposed ? `£${rec.costingProposed}/wk` : '—'}
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <p className="font-semibold text-gray-800 truncate">{rec.referer || '—'}</p>
                            {rec.refererContactDetails && (
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{rec.refererContactDetails}</p>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <select
                              value={rec.status}
                              onChange={e => handleQuickStatusChange(rec.id, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${statusBadge}`}
                            >
                              <option value="LIVE">LIVE</option>
                              <option value="HELD">HELD</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {rec.accepted ? (
                              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Yes
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                No
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!rec.serviceSeekerId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecordForConvert(rec);
                                    setConvertOptions({ title: 'Client', status: 'PRE_ADMISSION' });
                                  }}
                                  title="Convert to Service User"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Convert</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditModal(rec)}
                                title="Edit Record"
                                className="p-1 text-gray-500 hover:text-[#224fa6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id)}
                                title="Delete Record"
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* New / Edit Case Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100">
                <div className="bg-[#224fa6] text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileSearch className="w-5 h-5 text-white/90" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {formData.id ? 'Edit Investigation Record' : 'Register New Investigation / Referral'}
                      </h3>
                      <p className="text-xs text-blue-100">Captures intake criteria conforming to Enquiry Tracker</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Resident / Candidate Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Arthur Pendelton"
                        value={formData.potentialResidentName}
                        onChange={e => setFormData(prev => ({ ...prev, potentialResidentName: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Property / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Oakwood Lodge, Maple House"
                        value={formData.property}
                        onChange={e => setFormData(prev => ({ ...prev, property: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={formData.dateReceived}
                        onChange={e => setFormData(prev => ({ ...prev, dateReceived: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Hours / Day</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 4.0"
                        value={formData.hoursAllocatedPerDay}
                        onChange={e => setFormData(prev => ({ ...prev, hoursAllocatedPerDay: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Costing Proposed (£/wk)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g. 150"
                        value={formData.costingProposed}
                        onChange={e => setFormData(prev => ({ ...prev, costingProposed: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referral Route</label>
                      <input
                        type="text"
                        placeholder="e.g. Adult Social Care, Hospital Discharge, CHC"
                        value={formData.referralRoute}
                        onChange={e => setFormData(prev => ({ ...prev, referralRoute: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pipeline Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white"
                      >
                        <option value="LIVE">LIVE</option>
                        <option value="HELD">HELD</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referrer Name & Organisation</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins (Social Worker)"
                        value={formData.referer}
                        onChange={e => setFormData(prev => ({ ...prev, referer: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referrer Contact Details</label>
                      <input
                        type="text"
                        placeholder="Phone number / Email address"
                        value={formData.refererContactDetails}
                        onChange={e => setFormData(prev => ({ ...prev, refererContactDetails: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="acceptedToggle"
                        checked={formData.accepted}
                        onChange={e => setFormData(prev => ({ ...prev, accepted: e.target.checked }))}
                        className="w-4 h-4 rounded text-[#224fa6] focus:ring-[#224fa6] border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="acceptedToggle" className="text-xs font-semibold text-gray-800 cursor-pointer select-none">
                        Package Accepted
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Admitted Date</label>
                      <input
                        type="date"
                        value={formData.admittedDate}
                        onChange={e => setFormData(prev => ({ ...prev, admittedDate: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Care & Support Needs Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Outline mobility, personal care, medication prompts, and primary support objectives..."
                      value={formData.needs}
                      onChange={e => setFormData(prev => ({ ...prev, needs: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rationale, Comments & Next Actions</label>
                    <textarea
                      rows={2}
                      placeholder="Assessment findings, funding approvals, manager notes, follow-up dates..."
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2.5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={submitting}
                    className="px-5 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : formData.id ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Convert to Service User Modal */}
          {selectedRecordForConvert && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">Convert to Service User</h3>
                      <p className="text-xs text-emerald-100">Admit candidate directly into service seeker register</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForConvert(null)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-xs text-gray-600">
                    Are you sure you want to convert <strong className="text-gray-900 font-bold">{selectedRecordForConvert.potentialResidentName}</strong> into an admitted Service User record?
                  </p>

                  <div className="mt-4 p-3.5 bg-gray-50 rounded-xl text-left text-xs space-y-2 border border-gray-200 text-gray-800">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Candidate Name:</span>
                      <span className="font-bold text-gray-900">{selectedRecordForConvert.potentialResidentName}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Property / Location:</span>
                      <span className="font-bold text-gray-900">{selectedRecordForConvert.property || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Hours Allocated:</span>
                      <span className="font-bold text-gray-900">{selectedRecordForConvert.hoursAllocatedPerDay ? `${selectedRecordForConvert.hoursAllocatedPerDay} hrs/day` : '0 hrs/day'}</span>
                    </div>
                    {selectedRecordForConvert.referralRoute && (
                      <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                        <span className="font-semibold text-gray-600">Referral Route:</span>
                        <span className="font-medium text-gray-800">{selectedRecordForConvert.referralRoute}</span>
                      </div>
                    )}
                    {selectedRecordForConvert.costingProposed && (
                      <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                        <span className="font-semibold text-gray-600">Proposed Costing:</span>
                        <span className="font-bold text-gray-900">£{selectedRecordForConvert.costingProposed}/wk</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-semibold text-gray-600">Referrer:</span>
                      <span className="font-medium text-gray-800">{selectedRecordForConvert.referer || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                      <select
                        value={convertOptions.title}
                        onChange={e => setConvertOptions(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Client">Client</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Miss">Miss</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                      <select
                        value={convertOptions.status}
                        onChange={e => setConvertOptions(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                        <option value="LIVE">LIVE</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-3 text-left">
                    Converting will create a Service User record, archive this enquiry, and generate initial admission records.
                  </p>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2.5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForConvert(null)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertToServiceUser}
                    disabled={converting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{converting ? 'Converting...' : 'Confirm Conversion'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
