'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  TrendingUp, 
  Calendar, 
  ClipboardList, 
  Database, 
  Plus, 
  Sparkles, 
  Download, 
  Save, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  UserCheck, 
  Award,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';
import KpiNavTabs from './KpiNavTabs';
import KpiActionPlanTable from './KpiActionPlanTable';
import KpiAnalyticsView from './KpiAnalyticsView';
import KpiCollationHub from './KpiCollationHub';

export default function KpiManager({ title = 'Key Performance Indicators (KPI) & Monthly Evaluations' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly', 'action-plan', 'analytics', 'collation'

  // Data States
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [activeEvaluation, setActiveEvaluation] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collating, setCollating] = useState(false);
  const [actionCounts, setActionCounts] = useState({ total: 0, open: 0, inProgress: 0, completed: 0 });

  // Notifications
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [showRowModal, setShowRowModal] = useState(false);
  const [activeRowItem, setActiveRowItem] = useState(null);

  // New Month Form State
  const [newMonthForm, setNewMonthForm] = useState({
    monthYear: '',
    periodCode: '',
    evaluatedBy: '',
    evaluatorRole: 'Registered Manager',
    overallRating: 'Good',
    summaryNotes: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['monthly', 'action-plan', 'analytics', 'collation'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);
  };

  // Fetch all monthly evaluations
  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kpi/evaluations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvaluations(data.evaluations || []);
        if (data.stats) {
          setActionCounts({
            total: data.stats.totalActionPlanItems || 0,
            open: data.stats.openActionsCount || 0,
            completed: (data.stats.totalActionPlanItems || 0) - (data.stats.openActionsCount || 0)
          });
        }

        // Set initial selected evaluation
        if (data.evaluations && data.evaluations.length > 0) {
          const currentSelected = data.evaluations.find(e => e.id === selectedEvalId) || data.evaluations[0];
          setSelectedEvalId(currentSelected.id);
          setActiveEvaluation(currentSelected);
          setEditableItems(JSON.parse(JSON.stringify(currentSelected.items || [])));
          setHasUnsavedChanges(false);
        }
      }
    } catch (err) {
      console.error('Error fetching KPI evaluations:', err);
      showNotification('Failed to load KPI evaluations', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedEvalId]);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  // When selectedEvalId changes, update active evaluation
  const handleSelectEvaluation = (evalId) => {
    const found = evaluations.find(e => e.id === evalId);
    if (found) {
      setSelectedEvalId(found.id);
      setActiveEvaluation(found);
      setEditableItems(JSON.parse(JSON.stringify(found.items || [])));
      setHasUnsavedChanges(false);
    }
  };

  // Auto-collate live system data into the active evaluation
  const handleAutoCollate = async (periodCodeToUse = null) => {
    if (!activeEvaluation) return;
    const period = periodCodeToUse || activeEvaluation.periodCode;

    try {
      setCollating(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/collate?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.collatedData?.areas) {
        const areaMap = data.collatedData.areas;

        setEditableItems(prevItems => {
          return prevItems.map(item => {
            const liveMatch = areaMap[item.area];
            if (liveMatch) {
              return {
                ...item,
                data: liveMatch.data || item.data,
                numericValue: liveMatch.numericValue !== undefined ? liveMatch.numericValue : item.numericValue,
                rationalle: item.rationalle ? item.rationalle : (liveMatch.rationalleTemplate || ''),
                actionsRequired: item.actionsRequired ? item.actionsRequired : (liveMatch.actionsTemplate || '')
              };
            }
            return item;
          });
        });

        setHasUnsavedChanges(true);
        showNotification(`Auto-collated live metrics for ${activeEvaluation.monthYear}. Review and click 'Save Changes'.`, 'success');
      } else {
        showNotification(data.error || 'Failed to auto-collate metrics', 'error');
      }
    } catch {
      showNotification('Network error while collating metrics', 'error');
    } finally {
      setCollating(false);
    }
  };

  // Handle cell edit in the evaluation table
  const handleItemChange = (index, field, value) => {
    setEditableItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Toggle "Added to Action Plan"
  const handleToggleActionPlan = (index) => {
    setEditableItems(prev => {
      const updated = [...prev];
      const currentVal = Boolean(updated[index].addedToActionPlan);
      updated[index] = {
        ...updated[index],
        addedToActionPlan: !currentVal,
        actionPlanStatus: !currentVal ? 'PENDING' : 'N/A'
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Save changes to current evaluation
  const handleSaveEvaluation = async () => {
    if (!activeEvaluation) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/evaluations/${activeEvaluation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluatedBy: activeEvaluation.evaluatedBy,
          evaluatorRole: activeEvaluation.evaluatorRole,
          status: activeEvaluation.status,
          overallRating: activeEvaluation.overallRating,
          summaryNotes: activeEvaluation.summaryNotes,
          items: editableItems
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Evaluation for ${activeEvaluation.monthYear} saved successfully.`, 'success');
        setHasUnsavedChanges(false);
        fetchEvaluations();
      } else {
        showNotification(data.error || 'Failed to save evaluation', 'error');
      }
    } catch {
      showNotification('Network error saving evaluation', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Create New Month Evaluation
  const handleCreateNewMonth = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kpi/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMonthForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Created new evaluation for ${newMonthForm.monthYear}.`, 'success');
        setShowNewMonthModal(false);
        setNewMonthForm({
          monthYear: '',
          periodCode: '',
          evaluatedBy: '',
          evaluatorRole: 'Registered Manager',
          overallRating: 'Good',
          summaryNotes: ''
        });
        await fetchEvaluations();
        if (data.evaluation?.id) {
          handleSelectEvaluation(data.evaluation.id);
        }
      } else {
        showNotification(data.error || 'Failed to create month evaluation', 'error');
      }
    } catch {
      showNotification('Network error creating evaluation', 'error');
    }
  };

  // Export to CSV matching sheets/KPI Analysis.xlsx
  const handleExportCSV = () => {
    if (!activeEvaluation) return;

    const headers = ['Area', 'Data', 'Rationalle', 'Actions Required', 'Added to Action Plan'];
    const rows = editableItems.map(item => [
      `"${(item.area || '').replace(/"/g, '""')}"`,
      `"${(item.data || '').replace(/"/g, '""')}"`,
      `"${(item.rationalle || '').replace(/"/g, '""')}"`,
      `"${(item.actionsRequired || '').replace(/"/g, '""')}"`,
      `"${item.addedToActionPlan ? 'Yes' : 'No'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KPI_Analysis_${activeEvaluation.periodCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Exported ${activeEvaluation.monthYear} KPI CSV report.`, 'success');
  };

  // Export to PDF matching CQC Audit Format
  const handleExportPDF = () => {
    if (!activeEvaluation) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFillColor(34, 79, 166);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`Monthly KPI Evaluation Report - ${activeEvaluation.monthYear}`, 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Evaluated By: ${activeEvaluation.evaluatedBy || 'Registered Manager'} (${activeEvaluation.evaluatorRole || 'Manager'}) | Status: ${activeEvaluation.status} | Rating: ${activeEvaluation.overallRating}`, 14, 32);

    const tableData = editableItems.map(item => [
      item.area,
      item.data || 'N/A',
      item.rationalle || '-',
      item.actionsRequired || 'None',
      item.addedToActionPlan ? 'Yes' : 'No'
    ]);

    doc.autoTable({
      startY: 38,
      head: [['Area', 'Data', 'Rationalle (Rationale)', 'Actions Required', 'Added to Action Plan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 79, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 38 },
        2: { cellWidth: 85 },
        3: { cellWidth: 85 },
        4: { cellWidth: 28, halign: 'center' }
      }
    });

    doc.save(`KPI_Evaluation_${activeEvaluation.periodCode}.pdf`);
    showNotification(`Generated PDF report for ${activeEvaluation.monthYear}.`, 'success');
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

          {/* Top Title Banner */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="p-2.5 bg-gradient-to-br from-[#224fa6] to-indigo-700 text-white rounded-xl shadow-md">
                    <TrendingUp className="w-6 h-6" />
                  </span>
                  Key Performance Indicators (KPI)
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Monthly KPI evaluations, data collation engine, and governance action plan tracking based on the quality framework.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewMonthModal(true)}
                  className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#224fa6]" />
                  <span>New Evaluation</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoCollate()}
                  disabled={collating || !activeEvaluation}
                  className="px-3.5 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="Query database and populate Data column automatically"
                >
                  <Sparkles className={`w-4 h-4 text-indigo-600 ${collating ? 'animate-spin' : ''}`} />
                  <span>{collating ? 'Collating...' : 'Auto-Collate System Data'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={!activeEvaluation}
                  className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={!activeEvaluation}
                  className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEvaluation}
                  disabled={saving || !hasUnsavedChanges}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 animate-pulse'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Evaluation'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <KpiNavTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={{
              monthly: evaluations.length,
              'action-plan': actionCounts.open || 0
            }}
          />

          {/* TAB 1: Monthly Evaluations */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              {/* Month Selector Pills & Metadata Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Month Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap mr-1">
                      Evaluations:
                    </span>
                    {evaluations.map(ev => {
                      const isSelected = ev.id === selectedEvalId;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => handleSelectEvaluation(ev.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#224fa6] text-white border-[#224fa6] shadow-sm'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{ev.monthYear}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {ev.overallRating || 'Good'}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowNewMonthModal(true)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-[#224fa6] hover:bg-blue-50 border border-dashed border-[#224fa6]/50 flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Month</span>
                    </button>
                  </div>

                  {/* Active Evaluation Summary Badge */}
                  {activeEvaluation && (
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-medium text-gray-700">
                        <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                        <span>Lead: <strong className="text-gray-900">{activeEvaluation.evaluatedBy || 'Registered Manager'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-medium text-gray-700">
                        <Award className="w-3.5 h-3.5 text-[#224fa6]" />
                        <span>Rating: <strong className="text-[#224fa6]">{activeEvaluation.overallRating || 'Good'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-medium text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status: <strong className="text-emerald-700">{activeEvaluation.status}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unsaved Changes Banner */}
              {hasUnsavedChanges && (
                <div className="bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>You have unsaved edits or auto-collated values in this evaluation.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveEvaluation}
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Now'}
                  </button>
                </div>
              )}

              {/* Main KPI Analysis Grid Table matching sheets/KPI Analysis.xlsx */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#224fa6]" />
                      {activeEvaluation ? `Evaluation Sheet: ${activeEvaluation.monthYear}` : 'KPI Analysis Sheet'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Standard 12 areas corresponding to the quality framework. Edit values inline or open full editor.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-gray-500">
                    Total Areas Evaluated: <strong className="text-gray-900">{editableItems.length}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3.5 px-4 w-44">Area</th>
                        <th className="py-3.5 px-4 w-56">Data (Metric / Figure)</th>
                        <th className="py-3.5 px-4 min-w-[280px]">Rationalle (Rationale & Context)</th>
                        <th className="py-3.5 px-4 min-w-[280px]">Actions Required</th>
                        <th className="py-3.5 px-4 w-36 text-center">Added to Action Plan</th>
                        <th className="py-3.5 px-4 w-16 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {editableItems.map((item, index) => {
                        const isActionAdded = Boolean(item.addedToActionPlan);

                        return (
                          <tr 
                            key={item.id || index}
                            className={`hover:bg-blue-50/20 transition-colors ${
                              isActionAdded ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            {/* 1. Area */}
                            <td className="py-3.5 px-4 font-bold text-gray-900 align-top">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#224fa6]"></span>
                                <span className="text-sm font-extrabold">{item.area}</span>
                              </div>
                            </td>

                            {/* 2. Data */}
                            <td className="py-3.5 px-4 align-top">
                              <textarea
                                rows={2}
                                value={item.data || ''}
                                onChange={(e) => handleItemChange(index, 'data', e.target.value)}
                                placeholder="Enter collated metric / count..."
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 bg-white font-semibold text-[#224fa6] focus:outline-none focus:ring-1 focus:ring-[#224fa6]"
                              />
                            </td>

                            {/* 3. Rationalle */}
                            <td className="py-3.5 px-4 align-top">
                              <textarea
                                rows={2}
                                value={item.rationalle || ''}
                                onChange={(e) => handleItemChange(index, 'rationalle', e.target.value)}
                                placeholder="Explain rationale, causes, and context..."
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#224fa6]"
                              />
                            </td>

                            {/* 4. Actions Required */}
                            <td className="py-3.5 px-4 align-top">
                              <textarea
                                rows={2}
                                value={item.actionsRequired || ''}
                                onChange={(e) => handleItemChange(index, 'actionsRequired', e.target.value)}
                                placeholder="Specific actions or management mitigations..."
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#224fa6]"
                              />
                            </td>

                            {/* 5. Added to Action Plan Toggle */}
                            <td className="py-3.5 px-4 text-center align-top whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleActionPlan(index)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                  isActionAdded
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'
                                }`}
                              >
                                {isActionAdded ? '✓ Added (Yes)' : 'No'}
                              </button>
                            </td>

                            {/* 6. Edit Modal Button */}
                            <td className="py-3.5 px-4 text-right align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRowItem({ item, index });
                                  setShowRowModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#224fa6] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Expand Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Save Prompt */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    💡 Tip: Clicking &quot;Added (Yes)&quot; escalates the action directly to the <strong>KPI Action Plan Register</strong>.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutoCollate()}
                      className="px-4 py-2 bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Re-Collate All System Data
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      disabled={saving || !hasUnsavedChanges}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasUnsavedChanges
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Action Plan Register */}
          {activeTab === 'action-plan' && (
            <KpiActionPlanTable onNotification={showNotification} />
          )}

          {/* TAB 3: Analytics & Trends */}
          {activeTab === 'analytics' && (
            <KpiAnalyticsView 
              evaluations={evaluations}
              actionCounts={actionCounts}
            />
          )}

          {/* TAB 4: Collation Engine & Sources Hub */}
          {activeTab === 'collation' && (
            <KpiCollationHub
              activePeriod={activeEvaluation?.periodCode || '2026-08'}
              onApplyCollation={(collatedData) => {
                handleAutoCollate(collatedData.period);
                setActiveTab('monthly');
              }}
            />
          )}

          {/* Modal: New Monthly Evaluation */}
          {showNewMonthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gradient-to-r from-[#224fa6] to-indigo-800 text-white flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Create New Monthly KPI Evaluation
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewMonthModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateNewMonth} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Month & Year Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. September 2026"
                        value={newMonthForm.monthYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewMonthForm(prev => ({
                            ...prev,
                            monthYear: val
                          }));
                        }}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Period Code (YYYY-MM) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2026-09"
                        value={newMonthForm.periodCode}
                        onChange={(e) => setNewMonthForm({ ...newMonthForm, periodCode: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Lead Reviewer / Evaluator
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Registered Manager"
                        value={newMonthForm.evaluatedBy}
                        onChange={(e) => setNewMonthForm({ ...newMonthForm, evaluatedBy: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Initial Rating
                      </label>
                      <select
                        value={newMonthForm.overallRating}
                        onChange={(e) => setNewMonthForm({ ...newMonthForm, overallRating: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                      >
                        <option value="Outstanding">Outstanding</option>
                        <option value="Good">Good</option>
                        <option value="Requires Improvement">Requires Improvement</option>
                        <option value="Inadequate">Inadequate</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Executive Summary / Strategic Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="High-level overview of monthly performance, priorities, and audit context..."
                      value={newMonthForm.summaryNotes}
                      onChange={(e) => setNewMonthForm({ ...newMonthForm, summaryNotes: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                    ✨ Will automatically initialize the 12 core KPI areas (*Occupancy, Live Enquiries, Safeguarding, CQC, RIDDOR, Accidents, Incidents, Near Misses, Complaints, Compliments, P&L, Sickness*).
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowNewMonthModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#224fa6] hover:bg-[#1b3f85] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow cursor-pointer"
                    >
                      Initialize Month
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Detailed Row / Area Editor */}
          {showRowModal && activeRowItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gradient-to-r from-[#224fa6] to-indigo-800 text-white flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Edit KPI Area: {activeRowItem.item.area}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRowModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Data (Collated Metric / Figure)
                    </label>
                    <input
                      type="text"
                      value={activeRowItem.item.data || ''}
                      onChange={(e) => {
                        handleItemChange(activeRowItem.index, 'data', e.target.value);
                        setActiveRowItem(prev => ({
                          ...prev,
                          item: { ...prev.item, data: e.target.value }
                        }));
                      }}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Rationalle (Contextual Rationale & Analysis)
                    </label>
                    <textarea
                      rows={3}
                      value={activeRowItem.item.rationalle || ''}
                      onChange={(e) => {
                        handleItemChange(activeRowItem.index, 'rationalle', e.target.value);
                        setActiveRowItem(prev => ({
                          ...prev,
                          item: { ...prev.item, rationalle: e.target.value }
                        }));
                      }}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Actions Required
                    </label>
                    <textarea
                      rows={3}
                      value={activeRowItem.item.actionsRequired || ''}
                      onChange={(e) => {
                        handleItemChange(activeRowItem.index, 'actionsRequired', e.target.value);
                        setActiveRowItem(prev => ({
                          ...prev,
                          item: { ...prev.item, actionsRequired: e.target.value }
                        }));
                      }}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#224fa6]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <div className="font-bold text-xs text-gray-900">Add to Action Plan</div>
                      <div className="text-[11px] text-gray-500">Escalate this row to the KPI Action Plan Register</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleActionPlan(activeRowItem.index);
                        setActiveRowItem(prev => ({
                          ...prev,
                          item: { 
                            ...prev.item, 
                            addedToActionPlan: !prev.item.addedToActionPlan 
                          }
                        }));
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activeRowItem.item.addedToActionPlan
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {activeRowItem.item.addedToActionPlan ? 'Yes (Added)' : 'No'}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowRowModal(false)}
                      className="px-5 py-2 bg-[#224fa6] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:bg-[#1b3f85] cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
