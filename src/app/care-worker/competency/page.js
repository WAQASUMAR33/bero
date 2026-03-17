'use client';

import { useState, useEffect } from 'react';

const OUTCOME_CONFIG = {
  PASS:         { label: 'Pass',         bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  FAIL:         { label: 'Fail',         bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  NEEDS_REVIEW: { label: 'Needs Review', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
};

const TYPE_LABELS = {
  OBSERVATION:     'Observation',
  SHADOWING:       'Shadowing',
  PRACTICAL_TEST:  'Practical Test',
};

export default function MyCompetencyPage() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    competencyName: '',
    type: 'OBSERVATION',
    date: new Date().toISOString().split('T')[0],
    outcome: 'PASS',
    notes: '',
    assessorName: '',
  });

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) { setError('Not authenticated'); return; }
      const userId = JSON.parse(storedUser).id;

      const res = await fetch(`/api/competency?staffId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      } else {
        setError('Failed to load competency records');
      }
    } catch {
      setError('Failed to load competency records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.competencyName.trim() || !form.date) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const userId = JSON.parse(storedUser).id;

      const res = await fetch('/api/competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staffId: userId,
          assessorId: userId, // self-reported from mobile; manager can reassign from admin
          competencyName: form.competencyName,
          type: form.type,
          date: form.date,
          outcome: form.outcome,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ competencyName: '', type: 'OBSERVATION', date: new Date().toISOString().split('T')[0], outcome: 'PASS', notes: '', assessorName: '' });
        fetchRecords();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const passCount = records.filter(r => r.outcome === 'PASS').length;
  const reviewCount = records.filter(r => r.outcome === 'NEEDS_REVIEW').length;
  const failCount = records.filter(r => r.outcome === 'FAIL').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competency records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Competencies</h1>
          <p className="text-gray-500 text-sm mt-1">Observations, sign-offs, and practical assessments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#224fa6] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-700">{passCount}</div>
          <div className="text-xs text-green-600 font-medium mt-1">Passed</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{reviewCount}</div>
          <div className="text-xs text-yellow-600 font-medium mt-1">Needs Review</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-700">{failCount}</div>
          <div className="text-xs text-red-600 font-medium mt-1">Failed</div>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No competency records yet. Add your first one.
          </div>
        ) : records.map(record => {
          const cfg = OUTCOME_CONFIG[record.outcome] || OUTCOME_CONFIG.NEEDS_REVIEW;
          return (
            <div key={record.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`}></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{record.competencyName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{TYPE_LABELS[record.type] || record.type}</span>
                      <span>•</span>
                      <span>{fmt(record.date)}</span>
                    </div>
                    {record.notes && (
                      <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{record.notes}</p>
                    )}
                  </div>
                </div>
                <span className={`ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Competency sign-offs are verified by your supervisor.
      </p>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Record Competency</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competency / Skill *</label>
                <input
                  type="text"
                  value={form.competencyName}
                  onChange={e => setForm(f => ({ ...f, competencyName: e.target.value }))}
                  placeholder="e.g. Manual Handling, Medication Administration"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  >
                    <option value="OBSERVATION">Observation</option>
                    <option value="SHADOWING">Shadowing</option>
                    <option value="PRACTICAL_TEST">Practical Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={form.outcome}
                    onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                  >
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                    <option value="NEEDS_REVIEW">Needs Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any observations or feedback..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#224fa6] resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.competencyName.trim()}
                className="flex-1 bg-[#224fa6] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
