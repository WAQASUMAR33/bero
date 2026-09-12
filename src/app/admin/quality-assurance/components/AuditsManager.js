'use client';

import { useState, useEffect } from 'react';

export default function AuditsManager({ user, onNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAuditForRun, setSelectedAuditForRun] = useState(null);
  const [showAddAuditModal, setShowAddAuditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form state for running an audit
  const [auditForm, setAuditForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    passedItems: 0,
    totalItems: 0,
    findings: '',
    actionsRequired: '',
    checklistScores: {},
  });

  // Form state for creating a new audit template
  const [newAuditForm, setNewAuditForm] = useState({
    title: '',
    category: 'Care Quality',
    frequency: 'Monthly',
    targetScore: 90,
    description: '',
    assignedToId: '',
  });

  useEffect(() => {
    fetchAuditsData();
  }, [selectedYear]);

  const fetchAuditsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/quality-assurance/audits?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        if (onNotification) onNotification({ show: true, message: result.error || 'Failed to load audits', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Network error loading audits', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openRunAudit = (audit) => {
    setSelectedAuditForRun(audit);
    const checklist = Array.isArray(audit.checklist) ? audit.checklist : [];
    const initialScores = {};
    checklist.forEach(item => {
      initialScores[item.id || item.text] = true; // default to passed
    });

    setAuditForm({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      passedItems: checklist.length,
      totalItems: checklist.length,
      findings: '',
      actionsRequired: '',
      checklistScores: initialScores,
    });
  };

  const handleToggleChecklistItem = (id) => {
    setAuditForm(prev => {
      const updatedScores = {
        ...prev.checklistScores,
        [id]: !prev.checklistScores[id]
      };
      const passed = Object.values(updatedScores).filter(Boolean).length;
      return {
        ...prev,
        checklistScores: updatedScores,
        passedItems: passed,
      };
    });
  };

  const handleSaveAuditRun = async () => {
    if (!selectedAuditForRun) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const total = auditForm.totalItems || 1;
      const passed = auditForm.passedItems;
      const score = Math.round((passed / total) * 1000) / 10;

      const payload = {
        actionType: 'SUBMIT_AUDIT',
        auditId: selectedAuditForRun.id,
        month: auditForm.month,
        year: auditForm.year,
        scorePercentage: score,
        totalItems: total,
        passedItems: passed,
        findings: auditForm.findings,
        actionsRequired: auditForm.actionsRequired,
        checklistResults: auditForm.checklistScores,
      };

      const res = await fetch('/api/quality-assurance/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: `Audit "${selectedAuditForRun.title}" recorded with score ${score}%!`, type: 'success' });
        setSelectedAuditForRun(null);
        await fetchAuditsData();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to submit audit', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to record audit run', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewAudit = async () => {
    if (!newAuditForm.title.trim()) {
      if (onNotification) onNotification({ show: true, message: 'Please enter audit title', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actionType: 'CREATE_AUDIT',
          ...newAuditForm,
        })
      });

      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: 'New audit schedule created successfully!', type: 'success' });
        setShowAddAuditModal(false);
        setNewAuditForm({
          title: '',
          category: 'Care Quality',
          frequency: 'Monthly',
          targetScore: 90,
          description: '',
          assignedToId: '',
        });
        await fetchAuditsData();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to create audit', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Error creating audit', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = data?.audits ? ['ALL', ...new Set(data.audits.map(a => a.category))] : ['ALL'];
  const filteredAudits = data?.audits ? data.audits.filter(a => categoryFilter === 'ALL' || a.category === categoryFilter) : [];

  if (loading && !data) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-3 font-medium">Loading Audits & Compliance Data...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const monthsData = data?.monthsData || [];
  const submissions = data?.submissions || [];

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Month Compliance % */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Overall Audit Score</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 text-sm">📊</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.currentMonthScore ? `${stats.currentMonthScore}%` : 'N/A'}
            </span>
            {stats.delta !== null && (
              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                stats.delta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.delta >= 0 ? `+${stats.delta}%` : `${stats.delta}%`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.previousMonthScore !== null
              ? `vs. ${stats.previousMonthScore}% in previous month`
              : 'Current month compliance rate'}
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/30 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Previous Month Score */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Previous Month</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-sm">🗓️</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.previousMonthScore ? `${stats.previousMonthScore}%` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Historical baseline for comparison</p>
        </div>

        {/* Active Audit Schedules */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Scheduled Audits</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm">🛡️</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.totalAuditsConfigured || 0}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active compliance audit templates</p>
        </div>

        {/* Submissions Completed This Year */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Audits Run in {selectedYear}</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-sm">✅</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.totalSubmissionsThisYear || 0}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Completed audit inspections</p>
        </div>
      </div>

      {/* Month-over-Month Audit Percentage Tracking Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📈</span>
              <span>Month-over-Month Audit Percentages & Previous Months Tracking</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Visual tracking of audit compliance percentages across all months with previous month comparisons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-gray-700 cursor-pointer focus:ring-2 focus:ring-purple-500"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Monthly Score Trackers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2.5 pt-6">
          {monthsData.map(m => {
            const hasScore = m.score !== null;
            const isTargetMet = hasScore && m.score >= 90;
            const isNeedsWork = hasScore && m.score >= 75 && m.score < 90;

            let barColor = 'bg-gray-200';
            let badgeColor = 'bg-gray-100 text-gray-500';
            if (hasScore) {
              if (isTargetMet) {
                barColor = 'bg-emerald-500';
                badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
              } else if (isNeedsWork) {
                barColor = 'bg-amber-500';
                badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
              } else {
                barColor = 'bg-red-500';
                badgeColor = 'bg-red-100 text-red-800 border border-red-200';
              }
            }

            return (
              <div
                key={m.month}
                className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                  m.isCurrent
                    ? 'border-purple-400 bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                    : 'border-gray-100 bg-gray-50/40 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${m.isCurrent ? 'text-purple-900' : 'text-gray-700'}`}>
                      {m.monthName}
                    </span>
                    {m.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" title="Current Month"></span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className={`text-base font-extrabold ${hasScore ? 'text-gray-900' : 'text-gray-400'}`}>
                      {hasScore ? `${m.score}%` : '-'}
                    </span>
                  </div>
                </div>

                {/* Vertical mini percentage bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${hasScore ? Math.min(100, m.score) : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>{m.auditsCount} run{m.auditsCount !== 1 ? 's' : ''}</span>
                    {m.prevYearScore !== null && (
                      <span title={`Previous year: ${m.prevYearScore}%`}>
                        PY: {m.prevYearScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Schedules Management Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>Scheduled Audits & Compliance Checklists</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review audit frequencies, assigned personnel, target scores, and conduct scheduled audits
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddAuditModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>➕ Add Custom Audit</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Audits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudits.map(audit => {
            const latestSubmission = audit.submissions?.[0];
            const checklistCount = Array.isArray(audit.checklist) ? audit.checklist.length : 0;
            const targetScore = audit.targetScore || 90;

            let scoreColor = 'text-gray-500';
            if (latestSubmission) {
              scoreColor = latestSubmission.scorePercentage >= targetScore ? 'text-emerald-600' : 'text-amber-600';
            }

            return (
              <div
                key={audit.id}
                className="bg-gray-50/50 hover:bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {audit.frequency}
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                      Target: {targetScore}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mt-1">{audit.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{audit.description || 'No description provided.'}</p>

                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Assigned To:</span>
                      <span className="font-semibold text-gray-800">
                        {audit.assignedTo ? `${audit.assignedTo.firstName} ${audit.assignedTo.lastName}` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Checklist Items:</span>
                      <span className="font-medium text-gray-700">{checklistCount} checkpoints</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Latest Result:</span>
                      <span className={`font-bold ${scoreColor}`}>
                        {latestSubmission ? `${latestSubmission.scorePercentage}% (${latestSubmission.status})` : 'Not run yet'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openRunAudit(audit)}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>▶️ Run Audit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>🕒</span>
              <span>Recent Audit Records & Findings Log</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Full historical audit submission results with evaluator details</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-500 font-medium">No audit submissions recorded for {selectedYear} yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Run Audit" above on any scheduled audit to record findings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Audit Title</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Score %</th>
                  <th className="py-3 px-4">Passed / Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evaluator</th>
                  <th className="py-3 px-4">Findings & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(sub => {
                  const monthName = new Date(sub.year, sub.month - 1, 1).toLocaleString('default', { month: 'short' });
                  return (
                    <tr key={sub.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{sub.auditTitle}</td>
                      <td className="py-3 px-4 text-gray-600">{monthName} {sub.year}</td>
                      <td className="py-3 px-4 font-extrabold text-gray-900">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          sub.scorePercentage >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          sub.scorePercentage >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.scorePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{sub.passedItems} / {sub.totalItems}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sub.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          sub.status === 'NEEDS_IMPROVEMENT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {sub.conductedBy ? `${sub.conductedBy.firstName} ${sub.conductedBy.lastName}` : 'System'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-500" title={sub.findings}>
                        {sub.findings || 'No notes'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run Audit Modal */}
      {selectedAuditForRun && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Conduct Audit: {selectedAuditForRun.title}</h3>
                <p className="text-xs text-purple-100 mt-0.5">Target Compliance: {selectedAuditForRun.targetScore}% | Frequency: {selectedAuditForRun.frequency}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditForRun(null)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Period selection */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Month</label>
                  <select
                    value={auditForm.month}
                    onChange={e => setAuditForm(prev => ({ ...prev, month: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Year</label>
                  <select
                    value={auditForm.year}
                    onChange={e => setAuditForm(prev => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist verification items */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Audit Checkpoints & Compliance Scoring</h4>
                {Array.isArray(selectedAuditForRun.checklist) && selectedAuditForRun.checklist.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAuditForRun.checklist.map((item, idx) => {
                      const id = item.id || `item_${idx}`;
                      const isPassed = !!auditForm.checklistScores[id];
                      return (
                        <div
                          key={id}
                          onClick={() => handleToggleChecklistItem(id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isPassed
                              ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                              : 'bg-red-50/60 border-red-300 text-red-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">{isPassed ? '✅' : '❌'}</span>
                            <span className="text-xs font-medium">{item.text}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPassed ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                          }`}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Passed Items</label>
                      <input
                        type="number"
                        value={auditForm.passedItems}
                        onChange={e => setAuditForm(prev => ({ ...prev, passedItems: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full text-xs border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Total Items</label>
                      <input
                        type="number"
                        value={auditForm.totalItems}
                        onChange={e => setAuditForm(prev => ({ ...prev, totalItems: parseInt(e.target.value, 10) || 1 }))}
                        className="w-full text-xs border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Calculated Score */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Calculated Audit Score</span>
                  <p className="text-xs text-purple-700 mt-0.5">
                    {auditForm.passedItems} of {auditForm.totalItems || 1} checkpoints passed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-900">
                    {Math.round((auditForm.passedItems / (auditForm.totalItems || 1)) * 1000) / 10}%
                  </span>
                </div>
              </div>

              {/* Findings & Actions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Findings & Notes</label>
                <textarea
                  rows={2}
                  value={auditForm.findings}
                  onChange={e => setAuditForm(prev => ({ ...prev, findings: e.target.value }))}
                  placeholder="Record summary observations, strengths identified, and gaps..."
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remedial Actions Required</label>
                <textarea
                  rows={2}
                  value={auditForm.actionsRequired}
                  onChange={e => setAuditForm(prev => ({ ...prev, actionsRequired: e.target.value }))}
                  placeholder="Actions to resolve any non-compliant areas (can be assigned to staff in Action Plans)..."
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedAuditForRun(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAuditRun}
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Recording Audit...' : 'Save & Record Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Audit Schedule Modal */}
      {showAddAuditModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Add Custom Audit Schedule</h3>
              <button type="button" onClick={() => setShowAddAuditModal(false)} className="text-white text-2xl leading-none cursor-pointer">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Health and Safety Spot Checks Audit"
                  value={newAuditForm.title}
                  onChange={e => setNewAuditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Clinical, Care Quality, HR"
                    value={newAuditForm.category}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                  <select
                    value={newAuditForm.frequency}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annually">Bi-Annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Score (%)</label>
                  <input
                    type="number"
                    value={newAuditForm.targetScore}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, targetScore: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe scope, criteria, and objectives of this audit..."
                  value={newAuditForm.description}
                  onChange={e => setNewAuditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowAddAuditModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewAudit}
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create Audit Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
