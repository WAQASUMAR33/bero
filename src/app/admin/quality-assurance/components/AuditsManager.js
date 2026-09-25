'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Calendar, Clock } from 'lucide-react';

export default function AuditsManager({ user, onNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAuditForRun, setSelectedAuditForRun] = useState(null);
  const [showAddAuditModal, setShowAddAuditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'cards'
  const [staffList, setStaffList] = useState([]);

  // Reassign Modal State
  const [selectedAuditForReassign, setSelectedAuditForReassign] = useState(null);
  const [reassignForm, setReassignForm] = useState({
    assignedToId: '',
    nextDue: '',
    location: '',
    frequency: '',
  });

  // Action Plan Auto-Prompt Modal State
  const [actionPromptData, setActionPromptData] = useState(null); // { audit, failedQuestions, assignedStaffId, dueDate }
  const [actionAddingStatus, setActionAddingStatus] = useState({});

  // Form state for running an audit
  const [auditForm, setAuditForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    passedItems: 0,
    totalItems: 0,
    findings: '',
    actionsRequired: '',
    checklistScores: {}, // { [id]: { passed: boolean, comment: string } }
  });

  // Form state for creating a new audit template
  const [newAuditForm, setNewAuditForm] = useState({
    title: '',
    category: 'Care Quality',
    location: 'Head Office',
    frequency: 'Monthly',
    targetScore: 90,
    description: '',
    comments: '',
    assignedToId: '',
  });

  useEffect(() => {
    fetchAuditsData();
    fetchStaffList();
  }, [selectedYear]);

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance/actions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data?.staffList) {
        setStaffList(result.data.staffList);
      }
    } catch (e) {
      console.error('Error fetching staff list:', e);
    }
  };

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
    checklist.forEach((item, idx) => {
      const qId = item.id || `q_${idx + 1}`;
      initialScores[qId] = {
        passed: true,
        score: 1,
        number: item.number || `${idx + 1}.0`,
        text: item.text,
        comment: '',
      };
    });

    setAuditForm({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      passedItems: checklist.length,
      totalItems: checklist.length || 1,
      findings: '',
      actionsRequired: '',
      checklistScores: initialScores,
    });
  };

  const handleSetQuestionAnswer = (qId, answerValue, itemText, qNumber) => {
    setAuditForm(prev => {
      const prevEntry = prev.checklistScores[qId] || {};
      const isPassed = answerValue === 'YES' || answerValue === 'NA';
      const updatedScores = {
        ...prev.checklistScores,
        [qId]: {
          ...prevEntry,
          passed: isPassed,
          score: isPassed ? 1 : 0,
          answer: answerValue,
          number: qNumber || prevEntry.number || '',
          text: itemText || prevEntry.text || '',
        }
      };

      const passedCount = Object.values(updatedScores).filter(s => s.passed).length;
      return {
        ...prev,
        checklistScores: updatedScores,
        passedItems: passedCount,
      };
    });
  };

  const handleSetQuestionComment = (qId, comment) => {
    setAuditForm(prev => ({
      ...prev,
      checklistScores: {
        ...prev.checklistScores,
        [qId]: {
          ...prev.checklistScores[qId],
          comment,
        }
      }
    }));
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
        const completedAudit = selectedAuditForRun;
        setSelectedAuditForRun(null);
        await fetchAuditsData();

        // Check if any failed questions should auto-prompt Action Plan creation
        if (json.failedQuestions && json.failedQuestions.length > 0) {
          setActionPromptData({
            audit: completedAudit,
            failedQuestions: json.failedQuestions,
            assignedStaffId: completedAudit.assignedToId || (staffList[0]?.id ? String(staffList[0].id) : ''),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        }
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

  const handleCreateActionFromFinding = async (question) => {
    if (!actionPromptData?.assignedStaffId) {
      if (onNotification) onNotification({ show: true, message: 'Please select a staff member to assign this action', type: 'error' });
      return;
    }
    setActionAddingStatus(prev => ({ ...prev, [question.id]: 'loading' }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId: parseInt(actionPromptData.assignedStaffId, 10),
          title: `${actionPromptData.audit.title}: ${question.number || ''} ${question.text}`.slice(0, 200),
          item: actionPromptData.audit.title,
          description: `Audit Remediation: Checkpoint "${question.text}" scored Non-Compliant. ${question.comment ? `Notes: ${question.comment}` : ''}`,
          actionRequired: `Rectify compliance issue: ${question.text}`,
          dateIdentified: new Date().toISOString().split('T')[0],
          dueDate: actionPromptData.dueDate,
          priority: 'HIGH',
          source: 'Audit Finding',
          auditId: actionPromptData.audit.id,
          comments: question.comment || 'Auto-generated from failed audit inspection checkpoint',
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionAddingStatus(prev => ({ ...prev, [question.id]: 'added' }));
        if (onNotification) onNotification({ show: true, message: 'Action successfully created and assigned to staff action plan!', type: 'success' });
      } else {
        setActionAddingStatus(prev => ({ ...prev, [question.id]: 'error' }));
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to create action', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setActionAddingStatus(prev => ({ ...prev, [question.id]: 'error' }));
    }
  };

  const openReassignModal = (audit) => {
    setSelectedAuditForReassign(audit);
    setReassignForm({
      assignedToId: audit.assignedToId ? String(audit.assignedToId) : '',
      nextDue: audit.nextDue ? new Date(audit.nextDue).toISOString().split('T')[0] : '',
      location: audit.location || 'Head Office',
      frequency: audit.frequency || 'Monthly',
    });
  };

  const handleSaveReassign = async () => {
    if (!selectedAuditForReassign) return;
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
          actionType: 'REASSIGN_AUDIT',
          auditId: selectedAuditForReassign.id,
          assignedToId: reassignForm.assignedToId,
          nextDue: reassignForm.nextDue,
          location: reassignForm.location,
          frequency: reassignForm.frequency,
        })
      });
      const json = await res.json();
      if (json.success) {
        if (onNotification) onNotification({ show: true, message: 'Audit schedule & assignment updated successfully!', type: 'success' });
        setSelectedAuditForReassign(null);
        await fetchAuditsData();
      } else {
        if (onNotification) onNotification({ show: true, message: json.error || 'Failed to update schedule', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Error updating schedule', type: 'error' });
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
          location: 'Head Office',
          frequency: 'Monthly',
          targetScore: 90,
          description: '',
          comments: '',
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

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return s;
    }
  };

  const categories = data?.audits ? ['ALL', ...new Set(data.audits.map(a => a.category).filter(Boolean))] : ['ALL'];
  const locations = data?.audits ? ['ALL', ...new Set(data.audits.map(a => a.location).filter(Boolean))] : ['ALL'];

  const filteredAudits = (data?.audits || []).filter(a => {
    const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchLoc = locationFilter === 'ALL' || a.location === locationFilter;
    return matchCat && matchLoc;
  });

  if (loading && !data) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-3 font-medium">Loading Audits & Compliance Data...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const monthsData = data?.monthsData || [];
  const submissions = data?.submissions || [];

  return (
    <div className="space-y-6">
      {/* Top Banner with Month Percentage Trend Tracking */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#224fa6]">
                Monthly Trend Intelligence
              </span>
              <span className="text-xs text-gray-500">
                Track compliance percentages across previous months
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mt-1">Audit Percentages & Previous Months Tracking</h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-600">Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs font-bold border border-gray-300 rounded-xl px-3 py-1.5 bg-white text-gray-800 shadow-2xs"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Month Compliance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{stats.currentMonthScore || 0}%</span>
              {stats.delta !== null && (
                <span className={`text-xs font-bold ${stats.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.delta >= 0 ? `+${stats.delta}%` : `${stats.delta}%`} vs prev mo
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Average score across scheduled audits</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Previous Month</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-800">
                {stats.previousMonthScore !== null ? `${stats.previousMonthScore}%` : '—'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Benchmark from preceding period</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Audit Matrix</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#224fa6]">{stats.totalAuditsConfigured || 0}</span>
              <span className="text-xs text-gray-500">Checklists active</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Automated schedules across locations</p>
          </div>
        </div>

        {/* 12-Month Progression Line / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 pt-6">
          {monthsData.map(m => {
            const hasScore = m.score !== null;
            const isTargetMet = hasScore && m.score >= 90;
            const isNeedsWork = hasScore && m.score >= 75 && m.score < 90;

            let barColor = 'bg-gray-200';
            if (hasScore) {
              if (isTargetMet) barColor = 'bg-emerald-500';
              else if (isNeedsWork) barColor = 'bg-amber-500';
              else barColor = 'bg-red-500';
            }

            return (
              <div
                key={m.month}
                className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                  m.isCurrent
                    ? 'border-[#224fa6] bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${m.isCurrent ? 'text-[#224fa6]' : 'text-gray-700'}`}>
                      {m.monthName}
                    </span>
                    {m.isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-[#224fa6] animate-pulse" title="Current Month"></span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className={`text-base font-extrabold ${hasScore ? 'text-gray-900' : 'text-gray-400'}`}>
                      {hasScore ? `${m.score}%` : '—'}
                    </span>
                  </div>
                </div>

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
                      <span title={`Previous year: ${m.prevYearScore}%`}>PY:{m.prevYearScore}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Audit Matrix Section matching Beerusys/Audit Matrix.xlsx */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-[#224fa6]">
                Beerusys Audit Matrix
              </span>
              <span className="text-xs text-gray-500">
                Auto-reassigning frequencies with RAG status tracking
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              Care Audits Matrix & Checklists ({filteredAudits.length} Audits)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5 border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'matrix' ? 'bg-white text-[#224fa6] shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Matrix View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#224fa6] shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cards View
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddAuditModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <><Plus className="w-4 h-4" /><span>Add Custom Audit</span></>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#224fa6] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Location:</label>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-gray-800 font-medium"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc === 'ALL' ? 'All Locations' : loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* VIEW 1: Matrix Table View (matching Beerusys/Audit Matrix.xlsx) */}
        {viewMode === 'matrix' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Audit</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3 text-center">RAG Status</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Next Due</th>
                  <th className="py-3 px-3">By Whom</th>
                  <th className="py-3 px-3 text-center">% Score</th>
                  <th className="py-3 px-4">Comments</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAudits.map(audit => {
                  const latestSub = audit.submissions?.[0];
                  const rag = audit.ragStatus || 'DUE';
                  let ragBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                  let ragLabel = 'Due';
                  if (rag === 'GREEN') {
                    ragBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    ragLabel = 'Completed';
                  } else if (rag === 'RED') {
                    ragBadge = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
                    ragLabel = 'Overdue';
                  }

                  return (
                    <tr key={audit.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-gray-900 max-w-xs">
                        <p className="line-clamp-1">{audit.title}</p>
                        <span className="text-[10px] text-gray-400 font-normal">{audit.category}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-700">
                        {audit.location || 'Head Office'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {audit.frequency}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                        {audit.assignedTo ? `${audit.assignedTo.firstName} ${audit.assignedTo.lastName}` : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${ragBadge}`}>
                          {ragLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {formatDate(audit.lastCompleted)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-gray-800">
                        {formatDate(audit.nextDue)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {latestSub?.conductedBy ? `${latestSub.conductedBy.firstName} ${latestSub.conductedBy.lastName}` : '—'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {latestSub ? (
                          <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                            latestSub.scorePercentage >= audit.targetScore ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {latestSub.scorePercentage}%
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs text-gray-500 text-[11px] line-clamp-2">
                        {audit.comments || audit.description || '—'}
                      </td>

                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openRunAudit(audit)}
                          className="px-2.5 py-1 bg-[#224fa6] hover:bg-blue-800 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /><span>Run Audit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openReassignModal(audit)}
                          title="Allocate / Reschedule Audit"
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-[10px] border border-gray-300 transition-all cursor-pointer ml-1"
                        >
                          Schedule
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW 2: Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAudits.map(audit => {
              const latestSub = audit.submissions?.[0];
              const checklistCount = Array.isArray(audit.checklist) ? audit.checklist.length : 0;
              const targetScore = audit.targetScore || 90;
              const rag = audit.ragStatus || 'DUE';
              let ragBadge = 'bg-amber-100 text-amber-800 border-amber-300';
              let ragLabel = 'Due';
              if (rag === 'GREEN') {
                ragBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                ragLabel = 'Completed';
              } else if (rag === 'RED') {
                ragBadge = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
                ragLabel = 'Overdue';
              }

              return (
                <div
                  key={audit.id}
                  className="bg-gray-50/50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${ragBadge}`}>
                        {ragLabel}
                      </span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                        {audit.frequency} • Target {targetScore}%
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 mt-1">{audit.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{audit.comments || audit.description || 'No description provided.'}</p>

                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="font-semibold text-gray-800">{audit.location || 'Head Office'}</span>
                      </div>
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
                        <span className={`font-bold ${latestSub ? (latestSub.scorePercentage >= targetScore ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-400'}`}>
                          {latestSub ? `${latestSub.scorePercentage}% (${latestSub.status})` : 'Not run yet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openRunAudit(audit)}
                      className="flex-1 px-3 py-2 bg-[#224fa6] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <><Play className="w-3 h-3" /><span>Run Audit</span></>
                    </button>
                    <button
                      type="button"
                      onClick={() => openReassignModal(audit)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold border border-gray-300 transition-colors cursor-pointer"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Submissions History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
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
                    <tr key={sub.id} className="hover:bg-blue-50/20 transition-colors">
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
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {sub.conductedBy ? `${sub.conductedBy.firstName} ${sub.conductedBy.lastName}` : 'System Evaluator'}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-gray-500 truncate" title={sub.findings || ''}>
                        {sub.findings || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Run Audit Modal with full question list & YES/NO/NA scoring */}
      {selectedAuditForRun && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded">
                  {selectedAuditForRun.category} • {selectedAuditForRun.frequency}
                </span>
                <h3 className="text-base font-bold mt-1">Run Audit: {selectedAuditForRun.title}</h3>
                <p className="text-xs text-blue-100 mt-0.5">Location: {selectedAuditForRun.location || 'Head Office'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditForRun(null)}
                className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Month</label>
                  <select
                    value={auditForm.month}
                    onChange={e => setAuditForm(prev => ({ ...prev, month: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Year</label>
                  <input
                    type="number"
                    value={auditForm.year}
                    onChange={e => setAuditForm(prev => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  />
                </div>
              </div>

              {/* Checklist Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Checklist Inspection Items ({Array.isArray(selectedAuditForRun.checklist) ? selectedAuditForRun.checklist.length : 0} Questions)
                  </span>
                  <span className="text-[11px] text-gray-500">Score 1 for YES or N/A, Score 0 for NO</span>
                </div>

                {Array.isArray(selectedAuditForRun.checklist) && selectedAuditForRun.checklist.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedAuditForRun.checklist.map((item, idx) => {
                      const qId = item.id || `q_${idx + 1}`;
                      const qEntry = auditForm.checklistScores[qId] || { passed: true, answer: 'YES', comment: '' };
                      const isYes = qEntry.answer === 'YES' || (qEntry.passed && !qEntry.answer);
                      const isNo = qEntry.answer === 'NO' || (!qEntry.passed && !qEntry.answer);
                      const isNA = qEntry.answer === 'NA';

                      return (
                        <div
                          key={qId}
                          className={`p-3 rounded-xl border transition-all ${
                            isNo ? 'bg-red-50/60 border-red-300' : 'bg-gray-50/60 border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-xs font-bold text-[#224fa6] mr-2">
                                {item.number || `${idx + 1}.0`}
                              </span>
                              <span className="text-xs font-semibold text-gray-900">{item.text}</span>
                            </div>

                            {/* Scoring Buttons: YES / NO / NA */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetQuestionAnswer(qId, 'YES', item.text, item.number)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  isYes ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                YES (1)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetQuestionAnswer(qId, 'NO', item.text, item.number)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  isNo ? 'bg-red-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                NO (0)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetQuestionAnswer(qId, 'NA', item.text, item.number)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  isNA ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                N/A (1)
                              </button>
                            </div>
                          </div>

                          {/* Notes/Comments per question */}
                          <div className="mt-2 pt-2 border-t border-gray-200/50">
                            <input
                              type="text"
                              placeholder="Observation comment or details for this question..."
                              value={qEntry.comment || ''}
                              onChange={e => handleSetQuestionComment(qId, e.target.value)}
                              className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 text-gray-700"
                            />
                          </div>
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#224fa6] uppercase tracking-wider">Calculated Audit Score</span>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {auditForm.passedItems} of {auditForm.totalItems || 1} points achieved
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#224fa6]">
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
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remedial Actions Summary</label>
                <textarea
                  rows={2}
                  value={auditForm.actionsRequired}
                  onChange={e => setAuditForm(prev => ({ ...prev, actionsRequired: e.target.value }))}
                  placeholder="Overview of corrective actions required..."
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 shrink-0">
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
                className="px-5 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Recording Audit...' : 'Save & Record Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Prompt Action Plan Modal (Triggered when audit questions score NO) */}
      {actionPromptData && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded uppercase">
                  Action Required Prompt
                </span>
                <h3 className="text-base font-bold mt-1">Audit Findings: Add to Staff Action Plan</h3>
                <p className="text-xs text-red-100 mt-0.5">
                  {actionPromptData.failedQuestions.length} non-compliant question(s) identified during "{actionPromptData.audit.title}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionPromptData(null)}
                className="text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Assignee & Due Date selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-red-50/60 p-3 rounded-xl border border-red-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Assign Remedial Actions To *</label>
                  <select
                    value={actionPromptData.assignedStaffId}
                    onChange={e => setActionPromptData(prev => ({ ...prev, assignedStaffId: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  >
                    <option value="">Select Staff Member...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.role?.name || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Target Resolution Due Date</label>
                  <input
                    type="date"
                    value={actionPromptData.dueDate}
                    onChange={e => setActionPromptData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* List of failed questions */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Remediation Items Requiring Action Plans
                </span>

                {actionPromptData.failedQuestions.map(q => {
                  const status = actionAddingStatus[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-bold text-red-600 mr-2">{q.number || 'Item'}</span>
                        <span className="text-xs font-semibold text-gray-900">{q.text}</span>
                        {q.comment && (
                          <p className="text-[11px] text-gray-500 italic mt-1">Finding: {q.comment}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={status === 'added' || status === 'loading'}
                        onClick={() => handleCreateActionFromFinding(q)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
                          status === 'added'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-[#224fa6] hover:bg-blue-800 text-white shadow-2xs'
                        }`}
                      >
                        {status === 'added' ? 'Added to Plan' : status === 'loading' ? 'Adding...' : 'Add to Action Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setActionPromptData(null)}
                className="px-5 py-2 bg-[#224fa6] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign / Schedule Modal */}
      {selectedAuditForReassign && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Schedule & Reassign Audit</h3>
                <p className="text-xs text-blue-100 mt-0.5">{selectedAuditForReassign.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditForReassign(null)}
                className="text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To Staff Member</label>
                <select
                  value={reassignForm.assignedToId}
                  onChange={e => setReassignForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role?.name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Property</label>
                <input
                  type="text"
                  placeholder="e.g. Head Office, Oakwood Lodge"
                  value={reassignForm.location}
                  onChange={e => setReassignForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                <select
                  value={reassignForm.frequency}
                  onChange={e => setReassignForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Monthly">Bi-Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Bi-Annual">Bi-Annual</option>
                  <option value="Annually">Annually</option>
                  <option value="Ad Hoc">Ad Hoc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={reassignForm.nextDue}
                  onChange={e => setReassignForm(prev => ({ ...prev, nextDue: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedAuditForReassign(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReassign}
                disabled={submitting}
                className="px-5 py-2 bg-[#224fa6] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Audit Schedule Modal */}
      {showAddAuditModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Head Office, Oakwood Lodge"
                    value={newAuditForm.location}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                  <select
                    value={newAuditForm.frequency}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Monthly">Bi-Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annual">Bi-Annual</option>
                    <option value="Annually">Annually</option>
                    <option value="Ad Hoc">Ad Hoc</option>
                  </select>
                </div>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Scope & Objectives</label>
                <textarea
                  rows={2}
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
                className="px-5 py-2 bg-gradient-to-r from-[#224fa6] to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
