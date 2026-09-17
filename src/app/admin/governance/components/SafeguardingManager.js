'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SafeguardingManager({ showNotification }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, investigating: 0, closed: 0 });
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
    serviceUser: '',
    location: '',
    dateReported: new Date().toISOString().split('T')[0],
    localAuthority: '',
    reportedBy: '',
    details: '',
    actionsTaken: '',
    outcome: '',
    rcaCompleted: false,
    investigationCompleted: false,
    lessonsLearntCompleted: false,
    comments: '',
    status: 'OPEN',
    dateClosed: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/governance/safeguarding?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items || []);
        setCounts(json.data.counts || { total: 0, open: 0, investigating: 0, closed: 0 });
        setLocations(json.data.locations || []);
      } else {
        showNotification(json.error || 'Failed to load safeguarding incidents', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading safeguarding incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, locationFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.serviceUser?.trim()) {
      showNotification('Service User Name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/governance/safeguarding/${formData.id}` : '/api/governance/safeguarding';
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
        showNotification(json.message || 'Safeguarding record saved', 'success');
        setShowModal(false);
        setFormData(initialForm);
        fetchItems();
      } else {
        showNotification(json.error || 'Failed to save', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving safeguarding record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/safeguarding/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(`Status moved to ${newStatus}`, 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this safeguarding incident?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/safeguarding/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showNotification('Incident record deleted', 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to delete incident', 'error');
    }
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      incidentDate: item.incidentDate ? new Date(item.incidentDate).toISOString().split('T')[0] : '',
      serviceUser: item.serviceUser || '',
      location: item.location || '',
      dateReported: item.dateReported ? new Date(item.dateReported).toISOString().split('T')[0] : '',
      localAuthority: item.localAuthority || '',
      reportedBy: item.reportedBy || '',
      details: item.details || '',
      actionsTaken: item.actionsTaken || '',
      outcome: item.outcome || '',
      rcaCompleted: Boolean(item.rcaCompleted),
      investigationCompleted: Boolean(item.investigationCompleted),
      lessonsLearntCompleted: Boolean(item.lessonsLearntCompleted),
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
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text('Central Safeguarding Incidents Register', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')} | Total Safeguarding Records: ${items.length}`, 14, 22);

      const tableData = items.map((it) => [
        it.incidentDate ? new Date(it.incidentDate).toLocaleDateString('en-GB') : '—',
        it.serviceUser,
        it.location || '—',
        it.localAuthority || '—',
        it.reportedBy || '—',
        it.status,
        it.rcaCompleted ? 'Yes' : 'No',
        it.investigationCompleted ? 'Yes' : 'No',
        it.lessonsLearntCompleted ? 'Yes' : 'No',
        it.dateClosed ? new Date(it.dateClosed).toLocaleDateString('en-GB') : 'Open',
      ]);

      doc.autoTable({
        startY: 26,
        head: [['Incident Date', 'Service User', 'House / Location', 'Local Authority', 'Reported By', 'Status', 'RCA', 'Inv.', 'Lessons', 'Date Closed']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      });

      doc.save(`Safeguarding_Tracker_Report_${Date.now()}.pdf`);
      showNotification('Safeguarding report exported to PDF', 'success');
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
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Safeguarding</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.open}</p>
            <span className="text-[11px] text-gray-400">Open safeguarding alerts</span>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">🛡️</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Under Investigation</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.investigating}</p>
            <span className="text-[11px] text-gray-400">LA strategy / enquiry active</span>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">🔍</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Closed & Resolved</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.closed}</p>
            <span className="text-[11px] text-gray-400">Outcomes & lessons signed off</span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">✅</span>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Safeguarding Logs</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.total}</p>
            <span className="text-[11px] text-gray-400">Lifetime referrals logged</span>
          </div>
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xl">📋</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search service user, house, local authority, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchItems(); }} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                ✕
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
            <option value="INVESTIGATING">Investigating</option>
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
            <span>📄</span>
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={() => { setFormData(initialForm); setShowModal(true); }}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>➕</span>
            <span>Log Safeguarding Alert</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Loading safeguarding register...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="text-4xl">🛡️</span>
            <h3 className="text-base font-bold text-gray-800 mt-3">No safeguarding alerts found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              No safeguarding concerns logged matching this filter. Click "Log Safeguarding Alert" to create an entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Service User</th>
                  <th className="py-3 px-3">House / Location</th>
                  <th className="py-3 px-3">Local Authority</th>
                  <th className="py-3 px-4">Details & Actions</th>
                  <th className="py-3 px-3">Compliance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  let badge = 'bg-rose-100 text-rose-800 border-rose-200';
                  if (item.status === 'INVESTIGATING') badge = 'bg-amber-100 text-amber-800 border-amber-200';
                  else if (item.status === 'CLOSED') badge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-bold text-gray-900">
                          {item.incidentDate ? new Date(item.incidentDate).toLocaleDateString('en-GB') : '—'}
                        </p>
                        {item.dateReported && (
                          <span className="text-[10px] text-gray-400">
                            Reported: {new Date(item.dateReported).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{item.serviceUser}</p>
                        {item.reportedBy && (
                          <span className="text-[10px] text-gray-500">By: {item.reportedBy}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                        {item.location || '—'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                        {item.localAuthority || '—'}
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.investigationCompleted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                            Inv.
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.lessonsLearntCompleted ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'}`}>
                            Lessons
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
                          <option value="INVESTIGATING">INVESTIGATING</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-amber-700 hover:underline font-semibold text-xs cursor-pointer"
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
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {formData.id ? 'Edit Safeguarding Record' : 'Log Safeguarding Incident / Alert'}
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">Captures fields according to Beerusys Safeguarding Tracker</p>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Service User Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arthur Pendelton"
                    value={formData.serviceUser}
                    onChange={(e) => setFormData({ ...formData, serviceUser: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">House / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Oakwood Lodge"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Incident</label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Reported</label>
                  <input
                    type="date"
                    value={formData.dateReported}
                    onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Who Reported</label>
                  <input
                    type="text"
                    placeholder="Staff name / Relative"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Details of Safeguarding Concern *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline description of concern, signs of abuse/neglect, dates, context..."
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
                    placeholder="Immediate safety measures, body map, LA referral, police contact..."
                    value={formData.actionsTaken}
                    onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outcome</label>
                  <textarea
                    rows={2}
                    placeholder="Strategy meeting results, substantiated/unsubstantiated, case closed..."
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Quality Checklist */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="block text-xs font-bold text-gray-800 mb-2">Safeguarding Governance Verification</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rcaCompleted}
                      onChange={(e) => setFormData({ ...formData, rcaCompleted: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    Root Cause Analysis (RCA) Done
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.investigationCompleted}
                      onChange={(e) => setFormData({ ...formData, investigationCompleted: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    Investigation Completed
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lessonsLearntCompleted}
                      onChange={(e) => setFormData({ ...formData, lessonsLearntCompleted: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    Lessons Learnt Disseminated
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alert Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comments / Notes</label>
                  <input
                    type="text"
                    placeholder="Multi-agency notes..."
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : formData.id ? 'Update Record' : 'Save Safeguarding Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
