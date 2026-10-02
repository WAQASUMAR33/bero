'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CATEGORIES = [
  { value: 'CLINICAL', label: 'Clinical', color: 'bg-red-100 text-red-800' },
  { value: 'OPERATIONAL', label: 'Operational', color: 'bg-blue-100 text-blue-800' },
  { value: 'STAFF', label: 'Staff', color: 'bg-purple-100 text-purple-800' },
  { value: 'COMPLIANCE', label: 'Compliance', color: 'bg-orange-100 text-orange-800' },
  { value: 'SAFEGUARDING', label: 'Safeguarding', color: 'bg-pink-100 text-pink-800' },
  { value: 'HEALTH_AND_SAFETY', label: 'Health & Safety', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MEDICATION', label: 'Medication', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-100 text-gray-800' },
];

const STATUSES = [
  { value: 'OPEN', label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-green-100 text-green-800' },
];

function getCategoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) || { label: value, color: 'bg-gray-100 text-gray-800' };
}

function getStatusMeta(value) {
  return STATUSES.find(s => s.value === value) || { label: value, color: 'bg-gray-100 text-gray-800' };
}

export default function LessonsLearntManager({ user, onNotification }) {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/quality-assurance/lessons-learnt?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setLessons(result.data);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error('Error fetching lessons learnt:', err);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/quality-assurance/lessons-learnt/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setLessons(prev => prev.filter(l => l.id !== id));
        onNotification('Lesson learnt deleted successfully!', 'success');
      } else {
        onNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      onNotification('Error deleting lesson. Please try again.', 'error');
    }
  };

  const handleSave = async (formData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const url = selectedLesson
        ? `/api/quality-assurance/lessons-learnt/${selectedLesson.id}`
        : '/api/quality-assurance/lessons-learnt';
      const method = selectedLesson ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        onNotification(selectedLesson ? 'Lesson updated successfully!' : 'Lesson created successfully!', 'success');
        setShowModal(false);
        setSelectedLesson(null);
        fetchLessons();
      } else {
        onNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      onNotification('Error saving lesson. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(34, 79, 166);
      doc.text('Lessons Learnt Register', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 28);

      const tableData = filteredLessons.map(l => [
        new Date(l.dateOfEvent).toLocaleDateString('en-GB'),
        getCategoryMeta(l.category).label,
        l.title,
        getStatusMeta(l.status).label,
        l.responsiblePerson || '-',
        l.reviewDate ? new Date(l.reviewDate).toLocaleDateString('en-GB') : '-',
      ]);

      doc.autoTable({
        startY: 35,
        head: [['Date', 'Category', 'Title', 'Status', 'Responsible', 'Review Date']],
        body: tableData,
        headStyles: { fillColor: [34, 79, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 2: { cellWidth: 55 } }
      });

      let y = doc.lastAutoTable.finalY + 10;

      filteredLessons.forEach((l, i) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(34, 79, 166);
        doc.text(`${i + 1}. ${l.title}`, 14, y); y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);

        const fields = [
          ['Description', l.description],
          ['Lesson Learnt', l.lessonLearnt],
          ['Actions Taken', l.actionsTaken],
          ['Changes Made', l.changesMade],
        ];

        fields.forEach(([label, val]) => {
          if (!val) return;
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`${label}:`, 14, y); y += 5;
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(val, 180);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 3;
        });

        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 196, y); y += 8;
      });

      doc.save(`Lessons_Learnt_Register_${new Date().toISOString().split('T')[0]}.pdf`);
      onNotification('PDF exported successfully!', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      onNotification('Error generating PDF.', 'error');
    }
  };

  const filteredLessons = lessons.filter(l => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (l.title || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.lessonLearnt || '').toLowerCase().includes(q) ||
      (l.responsiblePerson || '').toLowerCase().includes(q) ||
      getCategoryMeta(l.category).label.toLowerCase().includes(q)
    );
  });

  // Summary counts
  const openCount = lessons.filter(l => l.status === 'OPEN').length;
  const inProgressCount = lessons.filter(l => l.status === 'IN_PROGRESS').length;
  const closedCount = lessons.filter(l => l.status === 'CLOSED').length;
  const overdueCount = lessons.filter(l => l.reviewDate && new Date(l.reviewDate) < new Date() && l.status !== 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Lessons Learnt Register</h2>
          <p className="text-gray-600 text-sm">Track incidents, identify lessons, and record improvements made.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={() => { setSelectedLesson(null); setShowModal(true); }}
            className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Lesson
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', count: openCount, color: 'from-yellow-400 to-yellow-500', icon: '📋' },
          { label: 'In Progress', count: inProgressCount, color: 'from-blue-400 to-blue-600', icon: '🔄' },
          { label: 'Closed', count: closedCount, color: 'from-green-500 to-green-600', icon: '✅' },
          { label: 'Overdue Review', count: overdueCount, color: 'from-red-500 to-red-600', icon: '⚠️' },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-3xl font-bold">{card.count}</div>
            <div className="text-sm opacity-90 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search title, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Register <span className="ml-2 text-sm font-normal text-gray-500">({filteredLessons.length} records)</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6] mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading lessons learnt...</p>
            </div>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons learnt found</h3>
            <p className="text-gray-500 text-sm mb-6">Start recording lessons to improve practice and compliance.</p>
            <button
              onClick={() => { setSelectedLesson(null); setShowModal(true); }}
              className="bg-[#224fa6] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a3d82] transition-colors text-sm font-medium"
            >
              Add First Lesson
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {['Date', 'Category', 'Title', 'Responsible', 'Review Date', 'Status', 'Created By', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLessons.map(lesson => {
                  const catMeta = getCategoryMeta(lesson.category);
                  const statusMeta = getStatusMeta(lesson.status);
                  const isOverdue = lesson.reviewDate && new Date(lesson.reviewDate) < new Date() && lesson.status !== 'CLOSED';
                  return (
                    <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lesson.dateOfEvent).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{lesson.title}</div>
                        {lesson.description && (
                          <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{lesson.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {lesson.responsiblePerson || '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                          {lesson.reviewDate ? new Date(lesson.reviewDate).toLocaleDateString('en-GB') : '-'}
                          {isOverdue && <span className="ml-1 text-xs">⚠️</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lesson.createdBy ? `${lesson.createdBy.firstName} ${lesson.createdBy.lastName}` : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(lesson.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedLesson(lesson); setViewModal(true); }}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setSelectedLesson(lesson); setShowModal(true); }}
                            className="p-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(lesson.id)}
                            className="p-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <LessonFormModal
          lesson={selectedLesson}
          onClose={() => { setShowModal(false); setSelectedLesson(null); }}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />
      )}

      {/* View Modal */}
      {viewModal && selectedLesson && (
        <LessonViewModal
          lesson={selectedLesson}
          onClose={() => { setViewModal(false); setSelectedLesson(null); }}
          onEdit={() => { setViewModal(false); setShowModal(true); }}
        />
      )}
    </div>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function LessonFormModal({ lesson, onClose, onSave, isSubmitting }) {
  const emptyForm = {
    dateOfEvent: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    description: '',
    lessonLearnt: '',
    actionsTaken: '',
    changesMade: '',
    responsiblePerson: '',
    reviewDate: '',
    status: 'OPEN',
  };

  const [formData, setFormData] = useState(
    lesson
      ? {
          dateOfEvent: new Date(lesson.dateOfEvent).toISOString().split('T')[0],
          category: lesson.category || '',
          title: lesson.title || '',
          description: lesson.description || '',
          lessonLearnt: lesson.lessonLearnt || '',
          actionsTaken: lesson.actionsTaken || '',
          changesMade: lesson.changesMade || '',
          responsiblePerson: lesson.responsiblePerson || '',
          reviewDate: lesson.reviewDate ? new Date(lesson.reviewDate).toISOString().split('T')[0] : '',
          status: lesson.status || 'OPEN',
        }
      : emptyForm
  );

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-[#224fa6] to-[#17387a] rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <h3 className="text-xl font-bold text-gray-900">{lesson ? 'Edit Lesson Learnt' : 'Add Lesson Learnt'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Date + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Event <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.dateOfEvent}
                onChange={e => set('dateOfEvent', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Please Select</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Brief title of the event or incident"
              value={formData.title}
              onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description of What Happened</label>
            <textarea
              rows={3}
              placeholder="Describe the event or incident in detail..."
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
            />
          </div>

          {/* Lesson Learnt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#224fa6] inline-block"></span>
                Lesson Learnt
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="What was the key lesson identified from this event?"
              value={formData.lessonLearnt}
              onChange={e => set('lessonLearnt', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
            />
          </div>

          {/* Actions Taken */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Actions Taken</label>
            <textarea
              rows={3}
              placeholder="What immediate actions were taken in response?"
              value={formData.actionsTaken}
              onChange={e => set('actionsTaken', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
            />
          </div>

          {/* Changes Made */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Changes Made to Practice / Policy</label>
            <textarea
              rows={3}
              placeholder="What changes to practice, policy or procedure were implemented?"
              value={formData.changesMade}
              onChange={e => set('changesMade', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
            />
          </div>

          {/* Row: Responsible + Review Date + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Responsible Person</label>
              <input
                type="text"
                placeholder="Name of responsible person"
                value={formData.responsiblePerson}
                onChange={e => set('responsiblePerson', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Date</label>
              <input
                type="date"
                value={formData.reviewDate}
                onChange={e => set('reviewDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : lesson ? 'Update Lesson' : 'Save Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function LessonViewModal({ lesson, onClose, onEdit }) {
  const catMeta = getCategoryMeta(lesson.category);
  const statusMeta = getStatusMeta(lesson.status);
  const isOverdue = lesson.reviewDate && new Date(lesson.reviewDate) < new Date() && lesson.status !== 'CLOSED';

  const Section = ({ title, value, highlight }) => {
    if (!value) return null;
    return (
      <div className={`p-4 rounded-xl ${highlight ? 'bg-[#224fa6]/5 border border-[#224fa6]/20' : 'bg-gray-50 border border-gray-200'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${highlight ? 'text-[#224fa6]' : 'text-gray-500'}`}>{title}</p>
        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{value}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-5 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
                  {catMeta.label}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  lesson.status === 'CLOSED' ? 'bg-green-500/30 text-green-100' :
                  lesson.status === 'IN_PROGRESS' ? 'bg-blue-300/30 text-blue-100' :
                  'bg-yellow-400/30 text-yellow-100'
                }`}>
                  {statusMeta.label}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
              <p className="text-blue-200 text-sm mt-1">
                Event date: {new Date(lesson.dateOfEvent).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Meta row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Responsible Person', value: lesson.responsiblePerson || 'Not specified' },
              {
                label: 'Review Date',
                value: lesson.reviewDate ? new Date(lesson.reviewDate).toLocaleDateString('en-GB') : 'Not set',
                highlight: isOverdue
              },
              {
                label: 'Recorded By',
                value: lesson.createdBy ? `${lesson.createdBy.firstName} ${lesson.createdBy.lastName}` : '-'
              },
            ].map(item => (
              <div key={item.label} className={`p-3 rounded-xl border ${item.highlight ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-sm font-medium ${item.highlight ? 'text-red-700' : 'text-gray-900'}`}>
                  {item.value} {item.highlight && '⚠️'}
                </p>
              </div>
            ))}
          </div>

          {/* Content sections */}
          <Section title="Description of What Happened" value={lesson.description} />
          <Section title="Lesson Learnt" value={lesson.lessonLearnt} highlight />
          <Section title="Actions Taken" value={lesson.actionsTaken} />
          <Section title="Changes Made to Practice / Policy" value={lesson.changesMade} />

          {/* Footer meta */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Created: {new Date(lesson.createdAt).toLocaleDateString('en-GB')}</span>
            {lesson.updatedBy && (
              <span>Last updated by {lesson.updatedBy.firstName} {lesson.updatedBy.lastName} · {new Date(lesson.updatedAt).toLocaleDateString('en-GB')}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
