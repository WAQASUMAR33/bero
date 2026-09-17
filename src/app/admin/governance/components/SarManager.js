'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SarManager({ showNotification }) {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    dateReceived: new Date().toISOString().split('T')[0],
    dateAcknowledged: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    receivedFrom: '',
    subjectName: '',
    informationRequested: '',
    formatReceived: 'Email',
    formatRequested: 'Electronic (Encrypted PDF)',
    purpose: '',
    requestGranted: 'PENDING',
    outcomeReason: '',
    dateInformationSent: '',
    handledBy: '',
    comments: '',
    status: 'OPEN',
    dateClosed: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const formatReceivedOptions = ['Email', 'Written Letter', 'Verbal / In Person', 'Local Authority Portal', 'Legal Portal'];
  const formatRequestedOptions = ['Electronic (Encrypted PDF)', 'Hardcopy (Printed File)', 'Secure Portal Upload', 'Digital Audio / Visual Copy'];
  const grantedOptions = [
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'YES', label: 'Granted in Full' },
    { value: 'PARTIAL', label: 'Partially Granted (Redacted)' },
    { value: 'NO', label: 'Declined / Exempt' }
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/governance/sar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items || []);
        setCounts(json.data.counts || { total: 0, open: 0, inProgress: 0, completed: 0 });
      } else {
        showNotification(json.error || 'Failed to load Subject Access Requests', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error loading SAR records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.subjectName?.trim()) {
      showNotification('Subject Name (Who is it regarding) is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/governance/sar/${formData.id}` : '/api/governance/sar';
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
        showNotification(json.message || 'SAR record saved', 'success');
        setShowModal(false);
        setFormData(initialForm);
        fetchItems();
      } else {
        showNotification(json.error || 'Failed to save', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving SAR record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/sar/${id}`, {
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
    if (!confirm('Are you sure you want to delete this Subject Access Request?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/governance/sar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showNotification('SAR record deleted', 'success');
        fetchItems();
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to delete SAR record', 'error');
    }
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      dateReceived: item.dateReceived ? new Date(item.dateReceived).toISOString().split('T')[0] : '',
      dateAcknowledged: item.dateAcknowledged ? new Date(item.dateAcknowledged).toISOString().split('T')[0] : '',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      receivedFrom: item.receivedFrom || '',
      subjectName: item.subjectName || '',
      informationRequested: item.informationRequested || '',
      formatReceived: item.formatReceived || 'Email',
      formatRequested: item.formatRequested || 'Electronic (Encrypted PDF)',
      purpose: item.purpose || '',
      requestGranted: item.requestGranted || 'PENDING',
      outcomeReason: item.outcomeReason || '',
      dateInformationSent: item.dateInformationSent ? new Date(item.dateInformationSent).toISOString().split('T')[0] : '',
      handledBy: item.handledBy || '',
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
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text('Subject Access Request (SAR) Compliance Register', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')} | Total SAR Records: ${items.length}`, 14, 22);

      const tableData = items.map((it) => [
        it.dateReceived ? new Date(it.dateReceived).toLocaleDateString('en-GB') : '—',
        it.dueDate ? new Date(it.dueDate).toLocaleDateString('en-GB') : '—',
        it.subjectName,
        it.receivedFrom || '—',
        it.formatRequested || '—',
        it.requestGranted,
        it.handledBy || '—',
        it.status,
        it.dateClosed ? new Date(it.dateClosed).toLocaleDateString('en-GB') : 'Open',
      ]);

      doc.autoTable({
        startY: 26,
        head: [['Received Date', 'Statutory Due', 'Subject Name', 'Received From', 'Format', 'Granted', 'Handled By', 'Status', 'Closed Date']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      });

      doc.save(`SAR_Register_Report_${Date.now()}.pdf`);
      showNotification('SAR report exported to PDF', 'success');
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
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">New / Unacknowledged</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.open}</p>
            <span className="text-[11px] text-gray-400">Awaiting processing</span>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">📩</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">In Progress (Collating)</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.inProgress}</p>
            <span className="text-[11px] text-gray-400">Within 30-day statutory clock</span>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">⏳</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed & Disclosed</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.completed}</p>
            <span className="text-[11px] text-gray-400">Redacted & dispatched</span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">✅</span>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total SAR Requests</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{counts.total}</p>
            <span className="text-[11px] text-gray-400">UK GDPR / DPA 2018 logs</span>
          </div>
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xl">📑</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search subject name, requester, handler, purpose..."
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
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
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
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>➕</span>
            <span>Log Subject Access Request</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Loading Subject Access Requests...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="text-4xl">📋</span>
            <h3 className="text-base font-bold text-gray-800 mt-3">No Subject Access Requests found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              No GDPR Subject Access Requests matching this criteria. Click "Log Subject Access Request" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date Received</th>
                  <th className="py-3 px-4">Subject & Requester</th>
                  <th className="py-3 px-3">Statutory Due Date</th>
                  <th className="py-3 px-4">Information Requested</th>
                  <th className="py-3 px-3">Format Requested</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  let badge = 'bg-rose-100 text-rose-800 border-rose-200';
                  if (item.status === 'IN_PROGRESS') badge = 'bg-amber-100 text-amber-800 border-amber-200';
                  else if (item.status === 'COMPLETED') badge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED';

                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-bold text-gray-900">
                          {item.dateReceived ? new Date(item.dateReceived).toLocaleDateString('en-GB') : '—'}
                        </p>
                        {item.dateAcknowledged && (
                          <span className="text-[10px] text-gray-400">
                            Ack: {new Date(item.dateAcknowledged).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{item.subjectName}</p>
                        {item.receivedFrom && (
                          <p className="text-[10px] text-gray-500 max-w-[180px] truncate">
                            From: {item.receivedFrom}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-gray-900'}`}>
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB') : '—'}
                        </p>
                        {isOverdue ? (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-bold">
                            ⚠️ OVERDUE
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">30-day statutory</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-gray-900 font-medium line-clamp-1">{item.informationRequested || '—'}</p>
                        {item.purpose && (
                          <p className="text-[11px] text-gray-400 truncate">Purpose: {item.purpose}</p>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {item.formatRequested || 'Electronic'}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.requestGranted === 'YES' && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Granted
                          </span>
                        )}
                        {item.requestGranted === 'PARTIAL' && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ~ Partial
                          </span>
                        )}
                        {item.requestGranted === 'NO' && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ✕ Declined
                          </span>
                        )}
                        {item.requestGranted === 'PENDING' && (
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatus(item.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${badge}`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-indigo-700 hover:underline font-semibold text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-600 font-medium text-xs cursor-pointer"
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {formData.id ? 'Edit Subject Access Request' : 'Log New Subject Access Request (SAR)'}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">Captures UK GDPR / DPA 2018 statutory fields</p>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Who is this regarding?"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Received From</label>
                  <input
                    type="text"
                    placeholder="e.g. Individual, Solicitor, Advocate"
                    value={formData.receivedFrom}
                    onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Handled By (Officer)</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Protection Lead"
                    value={formData.handledBy}
                    onChange={(e) => setFormData({ ...formData, handledBy: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Received *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateReceived}
                    onChange={(e) => {
                      const rec = new Date(e.target.value);
                      const due = new Date(rec.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setFormData({ ...formData, dateReceived: e.target.value, dueDate: due });
                    }}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Acknowledged</label>
                  <input
                    type="date"
                    value={formData.dateAcknowledged}
                    onChange={(e) => setFormData({ ...formData, dateAcknowledged: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Statutory Due Date (30 Days)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Format Received In</label>
                  <select
                    value={formData.formatReceived}
                    onChange={(e) => setFormData({ ...formData, formatReceived: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    {formatReceivedOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Format Requested In</label>
                  <select
                    value={formData.formatRequested}
                    onChange={(e) => setFormData({ ...formData, formatRequested: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    {formatRequestedOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">What Information Has Been Requested? *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Specify files, care notes, dates, medication charts requested..."
                  value={formData.informationRequested}
                  onChange={(e) => setFormData({ ...formData, informationRequested: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">What is the Purpose of the Request?</label>
                <input
                  type="text"
                  placeholder="e.g. Legal claim, personal reference, probate, continuing healthcare review..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Has the Request Been Granted?</label>
                  <select
                    value={formData.requestGranted}
                    onChange={(e) => setFormData({ ...formData, requestGranted: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    {grantedOptions.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outcome & Exemption Rationale</label>
                  <input
                    type="text"
                    placeholder="Why this outcome was reached (e.g. third-party redaction)..."
                    value={formData.outcomeReason}
                    onChange={(e) => setFormData({ ...formData, outcomeReason: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date Information Sent</label>
                  <input
                    type="date"
                    value={formData.dateInformationSent}
                    onChange={(e) => setFormData({ ...formData, dateInformationSent: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SAR Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Compliance Comments</label>
                <input
                  type="text"
                  placeholder="ID verification status, redaction audit logs..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                />
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : formData.id ? 'Update Record' : 'Save SAR Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
