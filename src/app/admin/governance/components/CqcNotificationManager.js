'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AlertCircle, Clock, CheckCircle2, FileText, FileDown, Plus, X } from 'lucide-react';


export default function CqcNotificationManager({ showNotification }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, underReview: 0, closed: 0 });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    incidentDate: new Date().toISOString().split('T')[0],
    notificationType: 'Serious Injury',
    location: '',
    serviceUserInitials: '',
    dateSent: new Date().toISOString().split('T')[0],
    reportedBy: '',
    companyNotificationId: '',
    cqcNotificationNumber: '',
    details: '',
    actionsTaken: '',
    outcome: '',
    rcaCompleted: false,
    safeguardingNotified: false,
    investigationCompleted: false,
    lessonsLearntCompleted: false,
    localAuthority: '',
    comments: '',
    status: 'OPEN',
    dateClosed: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const notificationTypes = [
    'Serious Injury',
    'Abuse or Allegation of Abuse',
    'Death of a Person using the Service',
    'Incident Reported to Police',
    'Unauthorised Absence / Missing Person',
    'Deprivation of Liberty Safeguards (DoLS)',
    'Event Stopping Service Operation',
    'Other Statutory Event',
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/governance/cqc-notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items || []);
        setCounts(json.data.counts || { total: 0, open: 0, underReview: 0, closed: 0 });
        setLocations(json.data.locations || []);
      } else {
        showNotification(json.error || 'Failed to load CQC notifications', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading CQC notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, locationFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.notificationType) {
      showNotification('Notification Type is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/governance/cqc-notifications/${formData.id}` : '/api/governance/cqc-notifications';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        showNotification(json.message || 'Saved successfully', 'success');
        setShowModal(false);
        setFormData(initialForm);
        fetchItems();
      } else {
        showNotification(json.error || 'Failed to save', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/cqc-notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(`Status updated to ${newStatus}`, 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this CQC notification record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/cqc-notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showNotification('Record deleted', 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to delete record', 'error');
    }
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      incidentDate: item.incidentDate ? new Date(item.incidentDate).toISOString().split('T')[0] : '',
      notificationType: item.notificationType || 'Serious Injury',
      location: item.location || '',
      serviceUserInitials: item.serviceUserInitials || '',
      dateSent: item.dateSent ? new Date(item.dateSent).toISOString().split('T')[0] : '',
      reportedBy: item.reportedBy || '',
      companyNotificationId: item.companyNotificationId || '',
      cqcNotificationNumber: item.cqcNotificationNumber || '',
      details: item.details || '',
      actionsTaken: item.actionsTaken || '',
      outcome: item.outcome || '',
      rcaCompleted: Boolean(item.rcaCompleted),
      safeguardingNotified: Boolean(item.safeguardingNotified),
      investigationCompleted: Boolean(item.investigationCompleted),
      lessonsLearntCompleted: Boolean(item.lessonsLearntCompleted),
      localAuthority: item.localAuthority || '',
      comments: item.comments || '',
      status: item.status || 'OPEN',
      dateClosed: item.dateClosed ? new Date(item.dateClosed).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.setTextColor(34, 79, 166);
      doc.text('CQC Statutory Notifications Register', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')} | Total Notifications: ${items.length}`, 14, 22);

      const tableData = items.map((it) => [
        it.incidentDate ? new Date(it.incidentDate).toLocaleDateString('en-GB') : '—',
        it.notificationType,
        it.location || '—',
        it.serviceUserInitials || '—',
        it.cqcNotificationNumber || it.companyNotificationId || '—',
        it.localAuthority || '—',
        it.reportedBy || '—',
        it.status,
        it.investigationCompleted ? 'Yes' : 'No',
        it.lessonsLearntCompleted ? 'Yes' : 'No',
      ]);

      doc.autoTable({
        startY: 26,
        head: [['Incident Date', 'Type', 'Location', 'SU Initials', 'CQC Ref / ID', 'Local Authority', 'Reported By', 'Status', 'Inv. Done', 'Lessons']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 79, 166], textColor: 255 },
      });

      doc.save(`CQC_Notifications_Report_${Date.now()}.pdf`);
      showNotification('PDF report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to export PDF', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Open Notifications</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.open}</p>
            <span className="text-[11px] text-gray-400">Statutory follow-up required</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Under Review</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.underReview}</p>
            <span className="text-[11px] text-gray-400">CQC enquiries / responses</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Closed & Completed</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.closed}</p>
            <span className="text-[11px] text-gray-400">Resolved & lessons logged</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Statutory Logs</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.total}</p>
            <span className="text-[11px] text-gray-400">Recorded CQC notifications</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search CQC ref, notification type, location, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchItems(); }} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={() => { setFormData(initialForm); setShowModal(true); }}
            className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New CQC Notification</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Loading CQC notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 mt-3">No CQC notifications found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              No statutory notification logs match your criteria. Click "New CQC Notification" to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Location & SU</th>
                  <th className="py-3 px-3">CQC Ref / ID</th>
                  <th className="py-3 px-4">Summary & Actions</th>
                  <th className="py-3 px-3">Compliance Badges</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  let badge = 'bg-rose-100 text-rose-800 border-rose-200';
                  if (item.status === 'UNDER_REVIEW') badge = 'bg-amber-100 text-amber-800 border-amber-200';
                  else if (item.status === 'CLOSED') badge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-bold text-gray-900">
                          {item.incidentDate ? new Date(item.incidentDate).toLocaleDateString('en-GB') : '—'}
                        </p>
                        {item.dateSent && (
                          <span className="text-[10px] text-gray-400">
                            Sent: {new Date(item.dateSent).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-gray-900">
                        {item.notificationType}
                        {item.localAuthority && (
                          <p className="text-[10px] text-gray-500 font-normal truncate max-w-[160px]">
                            {item.localAuthority}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-bold text-gray-900">{item.location || '—'}</p>
                        {item.serviceUserInitials && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                            SU: {item.serviceUserInitials}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-mono text-[11px] font-bold text-indigo-700">
                          {item.cqcNotificationNumber || '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.companyNotificationId}
                        </p>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-gray-900 font-medium line-clamp-1">{item.details || '—'}</p>
                        {item.actionsTaken && (
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            Actions: {item.actionsTaken}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.rcaCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
                            RCA
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.safeguardingNotified ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                            Safeguard
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.investigationCompleted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                            Inv.
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatus(item.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${badge}`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-[#224fa6] hover:underline font-semibold text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-xs cursor-pointer"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-100">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {formData.id ? 'Edit CQC Notification' : 'Log Statutory CQC Notification'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">Captures fields according to Beerusys CQC Notification Tracker</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Sent to CQC</label>
                  <input
                    type="date"
                    value={formData.dateSent}
                    onChange={(e) => setFormData({ ...formData, dateSent: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Type *</label>
                  <select
                    value={formData.notificationType}
                    onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    {notificationTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location / House</label>
                  <input
                    type="text"
                    placeholder="e.g. Oakwood Lodge"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SU Initials</label>
                  <input
                    type="text"
                    placeholder="e.g. J.D."
                    value={formData.serviceUserInitials}
                    onChange={(e) => setFormData({ ...formData, serviceUserInitials: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reported By</label>
                  <input
                    type="text"
                    placeholder="Staff name & designation"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CQC Notification Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. CQC-1098234-A"
                    value={formData.cqcNotificationNumber}
                    onChange={(e) => setFormData({ ...formData, cqcNotificationNumber: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Company ID</label>
                  <input
                    type="text"
                    placeholder="e.g. NOTIF-2026-001"
                    value={formData.companyNotificationId}
                    onChange={(e) => setFormData({ ...formData, companyNotificationId: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Local Authority (Which LA)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hertfordshire Council"
                    value={formData.localAuthority}
                    onChange={(e) => setFormData({ ...formData, localAuthority: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Details of the Incident *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline what happened, environment, immediate response..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Actions Taken</label>
                  <textarea
                    rows={2}
                    placeholder="Medical assistance, risk assessment review..."
                    value={formData.actionsTaken}
                    onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outcome</label>
                  <textarea
                    rows={2}
                    placeholder="Client condition, hospital feedback, CQC confirmation..."
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Checkbox matrix */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="block text-xs font-bold text-gray-800 mb-2">Quality & Governance Verification Checklist</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rcaCompleted}
                      onChange={(e) => setFormData({ ...formData, rcaCompleted: e.target.checked })}
                      className="rounded text-[#224fa6] focus:ring-[#224fa6]"
                    />
                    RCA Completed
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.safeguardingNotified}
                      onChange={(e) => setFormData({ ...formData, safeguardingNotified: e.target.checked })}
                      className="rounded text-[#224fa6] focus:ring-[#224fa6]"
                    />
                    Safeguarding Notified
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.investigationCompleted}
                      onChange={(e) => setFormData({ ...formData, investigationCompleted: e.target.checked })}
                      className="rounded text-[#224fa6] focus:ring-[#224fa6]"
                    />
                    Investigation Completed
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lessonsLearntCompleted}
                      onChange={(e) => setFormData({ ...formData, lessonsLearntCompleted: e.target.checked })}
                      className="rounded text-[#224fa6] focus:ring-[#224fa6]"
                    />
                    Lessons Learnt Done
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Closed</label>
                  <input
                    type="date"
                    value={formData.dateClosed}
                    onChange={(e) => setFormData({ ...formData, dateClosed: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Comments</label>
                  <input
                    type="text"
                    placeholder="Regulatory notes..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : formData.id ? 'Update Record' : 'Save Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
