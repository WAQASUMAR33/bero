'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function EnquiriesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE', 'HELD', 'CLOSED'
  const [enquiries, setEnquiries] = useState([]);
  const [counts, setCounts] = useState({ live: 0, held: 0, closed: 0, total: 0 });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEnquiryForView, setSelectedEnquiryForView] = useState(null);
  const [selectedEnquiryForConvert, setSelectedEnquiryForConvert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertOptions, setConvertOptions] = useState({
    title: 'Client',
    status: 'PRE_ADMISSION',
  });

  // Form state for creating or editing enquiry
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

  useEffect(() => {
    if (user) {
      fetchEnquiries();
    }
  }, [user, activeTab, propertyFilter]);

  const fetchEnquiries = async () => {
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
        setEnquiries(result.data.enquiries || []);
        setCounts(result.data.counts || { live: 0, held: 0, closed: 0, total: 0 });
        setProperties(result.data.properties || []);
      } else {
        showNotification(result.error || 'Failed to fetch enquiries', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnquiry = async () => {
    if (!formData.potentialResidentName?.trim()) {
      showNotification('Potential Resident Name is required', 'error');
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
        showNotification(isEditing ? 'Enquiry updated successfully' : 'New enquiry created successfully', 'success');
        setShowAddModal(false);
        resetForm();
        fetchEnquiries();
      } else {
        showNotification(json.error || 'Failed to save enquiry', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error saving enquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (enquiryId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showNotification(`Enquiry moved to ${newStatus}`, 'success');
        fetchEnquiries();
      } else {
        showNotification(json.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error updating status', 'error');
    }
  };

  const handleConvertToServiceUser = async () => {
    if (!selectedEnquiryForConvert) return;
    setConverting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${selectedEnquiryForConvert.id}/convert`, {
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
        showNotification(json.message || 'Successfully converted to Service User!', 'success');
        setSelectedEnquiryForConvert(null);
        fetchEnquiries();
      } else {
        showNotification(json.error || 'Failed to convert enquiry', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error during conversion', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        showNotification('Enquiry deleted', 'success');
        fetchEnquiries();
      } else {
        showNotification(json.error || 'Failed to delete enquiry', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error deleting enquiry', 'error');
    }
  };

  const openEditModal = (enquiry) => {
    setFormData({
      id: enquiry.id,
      property: enquiry.property || '',
      potentialResidentName: enquiry.potentialResidentName || '',
      dateReceived: enquiry.dateReceived ? new Date(enquiry.dateReceived).toISOString().split('T')[0] : '',
      referralRoute: enquiry.referralRoute || '',
      needs: enquiry.needs || '',
      hoursAllocatedPerDay: enquiry.hoursAllocatedPerDay || '',
      costingProposed: enquiry.costingProposed || '',
      referer: enquiry.referer || '',
      refererContactDetails: enquiry.refererContactDetails || '',
      status: enquiry.status || 'LIVE',
      accepted: enquiry.accepted || false,
      admittedDate: enquiry.admittedDate ? new Date(enquiry.admittedDate).toISOString().split('T')[0] : '',
      notes: enquiry.notes || '',
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
      doc.text(`Enquiries & Referrals Report (${activeTab} Pipeline)`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${filteredEnquiries.length}`, 14, 22);

      const tableData = filteredEnquiries.map(e => [
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
        head: [['Property', 'Resident Name', 'Date Received', 'Referral Route', 'Hours/Day', 'Costing', 'Referrer', 'Status', 'Accepted']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 79, 166], textColor: 255 }
      });

      doc.save(`Enquiries_Report_${activeTab}_${Date.now()}.pdf`);
      showNotification('Report exported to PDF', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to export PDF', 'error');
    }
  };

  // Filter inquiries based on local search
  const filteredEnquiries = enquiries.filter(e => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.potentialResidentName && e.potentialResidentName.toLowerCase().includes(term)) ||
      (e.property && e.property.toLowerCase().includes(term)) ||
      (e.referer && e.referer.toLowerCase().includes(term)) ||
      (e.referralRoute && e.referralRoute.toLowerCase().includes(term)) ||
      (e.needs && e.needs.toLowerCase().includes(term))
    );
  });

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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="p-2.5 bg-gradient-to-br from-[#224fa6] to-indigo-700 text-white rounded-xl shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  Enquiries & Referrals Management
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Track incoming client referrals across properties, manage live/held pipeline stages, and convert accepted enquiries into Service Users.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>📄</span>
                  <span>Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowAddModal(true); }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-base">➕</span>
                  <span>New Enquiry</span>
                </button>
              </div>
            </div>

            {/* Pipeline Tab Bar matching Beerusys/Enquiry Tracker.xlsx */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('LIVE')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'LIVE'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Enquiries</span>
                <span className="ml-1 px-2 py-0.5 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-800">
                  {counts.live}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('HELD')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'HELD'
                    ? 'bg-white text-amber-700 border-amber-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Held Enquiries</span>
                <span className="ml-1 px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-100 text-amber-800">
                  {counts.held}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CLOSED')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'CLOSED'
                    ? 'bg-white text-gray-800 border-gray-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                <span>Closed / Admitted</span>
                <span className="ml-1 px-2 py-0.5 text-xs font-extrabold rounded-full bg-gray-200 text-gray-800">
                  {counts.closed}
                </span>
              </button>
            </div>
          </div>

          {/* Quick KPI Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active Live Enquiries</span>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.live}</p>
                <span className="text-[11px] text-gray-400">Active prospective placements</span>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">🟢</span>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">On Hold / Pending</span>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.held}</p>
                <span className="text-[11px] text-gray-400">Awaiting funding / adaptations</span>
              </div>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">🟡</span>
            </div>

            <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Recorded Referrals</span>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.total}</p>
                <span className="text-[11px] text-gray-400">Lifetime referrals logged</span>
              </div>
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📋</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search resident name, referrer, route, or property..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:bg-white"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Property:</label>
                <select
                  value={propertyFilter}
                  onChange={e => setPropertyFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                >
                  <option value="all">All Properties</option>
                  {properties.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center">
                <div className="inline-block w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 mt-2 font-medium">Loading enquiries...</p>
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-16 px-4">
                <span className="text-4xl">📂</span>
                <h3 className="text-base font-bold text-gray-800 mt-3">No enquiries found</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  There are no referrals matching the selected filter ({activeTab}). Click "New Enquiry" to log a referral.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Property</th>
                      <th className="py-3 px-4">Potential Resident Name</th>
                      <th className="py-3 px-3">Date Received</th>
                      <th className="py-3 px-3">Referral Route</th>
                      <th className="py-3 px-4">Care Needs</th>
                      <th className="py-3 px-3">Hours / Day</th>
                      <th className="py-3 px-3">Costing</th>
                      <th className="py-3 px-3">Referrer</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEnquiries.map(enq => {
                      let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (enq.status === 'HELD') statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                      else if (enq.status === 'CLOSED') statusBadge = 'bg-gray-100 text-gray-800 border-gray-200';

                      return (
                        <tr key={enq.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                            {enq.property || <span className="text-gray-400 italic">Not Assigned</span>}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-bold text-gray-900 text-sm">{enq.potentialResidentName}</p>
                            {enq.serviceSeekerId && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                ✓ Service User #{enq.serviceSeekerId}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                            {enq.dateReceived ? new Date(enq.dateReceived).toLocaleDateString('en-GB') : '—'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-700">
                            {enq.referralRoute || '—'}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-gray-600 line-clamp-2 leading-relaxed">
                              {enq.needs || '—'}
                            </p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                            {enq.hoursAllocatedPerDay ? `${enq.hoursAllocatedPerDay} hrs` : '—'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-900">
                            {enq.costingProposed ? `£${enq.costingProposed}/wk` : '—'}
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <p className="font-semibold text-gray-800 truncate">{enq.referer || '—'}</p>
                            {enq.refererContactDetails && (
                              <p className="text-[10px] text-gray-400 truncate">{enq.refererContactDetails}</p>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <select
                              value={enq.status}
                              onChange={e => handleQuickStatusChange(enq.id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${statusBadge}`}
                            >
                              <option value="LIVE">LIVE</option>
                              <option value="HELD">HELD</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                            {/* 1-Click Convert to Service User */}
                            {!enq.serviceSeekerId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEnquiryForConvert(enq);
                                  setConvertOptions({ title: 'Client', status: 'PRE_ADMISSION' });
                                }}
                                title="Convert to Service User"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>⚡</span>
                                <span>Convert</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditModal(enq)}
                              className="text-[#224fa6] hover:underline font-semibold text-xs cursor-pointer ml-1"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEnquiry(enq.id)}
                              className="text-red-500 hover:text-red-700 font-medium text-xs cursor-pointer ml-1"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* New / Edit Enquiry Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">
                      {formData.id ? 'Edit Referral Enquiry' : 'Log New Referral Enquiry'}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">Captures fields according to Beerusys Enquiry Tracker</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Potential Resident Name *</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.potentialResidentName}
                        onChange={e => setFormData(prev => ({ ...prev, potentialResidentName: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Property / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Oakwood Lodge, Maple House"
                        value={formData.property}
                        onChange={e => setFormData(prev => ({ ...prev, property: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={formData.dateReceived}
                        onChange={e => setFormData(prev => ({ ...prev, dateReceived: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
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
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Costing Proposed (£)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g. 150"
                        value={formData.costingProposed}
                        onChange={e => setFormData(prev => ({ ...prev, costingProposed: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referral Route</label>
                      <input
                        type="text"
                        placeholder="e.g. Adult Social Care, Hospital, Direct"
                        value={formData.referralRoute}
                        onChange={e => setFormData(prev => ({ ...prev, referralRoute: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pipeline Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                      >
                        <option value="LIVE">LIVE</option>
                        <option value="HELD">HELD</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referrer Name & Organisation</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe (Social Worker)"
                        value={formData.referer}
                        onChange={e => setFormData(prev => ({ ...prev, referer: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Referrer Contact Details</label>
                      <input
                        type="text"
                        placeholder="Phone / Email"
                        value={formData.refererContactDetails}
                        onChange={e => setFormData(prev => ({ ...prev, refererContactDetails: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Care & Support Needs Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Outline mobility, personal care, medical conditions, and key support goals..."
                      value={formData.needs}
                      onChange={e => setFormData(prev => ({ ...prev, needs: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Notes & Progression</label>
                    <textarea
                      rows={2}
                      placeholder="Next steps, assessment dates, manager observations..."
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEnquiry}
                    disabled={submitting}
                    className="px-5 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : formData.id ? 'Update Enquiry' : 'Save Enquiry'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Convert to Service User Form Modal */}
          {selectedEnquiryForConvert && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">⚡</span>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">Convert to Service User</h3>
                      <p className="text-xs text-emerald-100">Create new client record from enquiry</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiryForConvert(null)}
                    className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-xs text-gray-600">
                    Are you sure you want to convert <strong className="text-gray-900 font-bold">{selectedEnquiryForConvert.potentialResidentName}</strong> directly into a Service User?
                  </p>

                  <div className="mt-4 p-3.5 bg-gray-50 rounded-xl text-left text-xs space-y-2 border border-gray-200 text-gray-800">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Candidate Name:</span>
                      <span className="font-bold text-gray-900">{selectedEnquiryForConvert.potentialResidentName}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Property / Location:</span>
                      <span className="font-bold text-gray-900">{selectedEnquiryForConvert.property || 'Default / Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Hours Allocated / Day:</span>
                      <span className="font-bold text-gray-900">{selectedEnquiryForConvert.hoursAllocatedPerDay ? `${selectedEnquiryForConvert.hoursAllocatedPerDay} hrs` : '0 hrs'}</span>
                    </div>
                    {selectedEnquiryForConvert.referralRoute && (
                      <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                        <span className="font-semibold text-gray-600">Referral Route:</span>
                        <span className="font-medium text-gray-800">{selectedEnquiryForConvert.referralRoute}</span>
                      </div>
                    )}
                    {selectedEnquiryForConvert.costingProposed && (
                      <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                        <span className="font-semibold text-gray-600">Proposed Costing:</span>
                        <span className="font-bold text-gray-900">£{selectedEnquiryForConvert.costingProposed}/wk</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-semibold text-gray-600">Referrer:</span>
                      <span className="font-medium text-gray-800">{selectedEnquiryForConvert.referer || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                      <select
                        value={convertOptions.title}
                        onChange={e => setConvertOptions(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
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
                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                        <option value="LIVE">LIVE</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-3 text-left">
                    ℹ️ This will create a Service User record, archive this enquiry, and generate initial admission & notes entries.
                  </p>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiryForConvert(null)}
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
                    <span>⚡</span>
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
