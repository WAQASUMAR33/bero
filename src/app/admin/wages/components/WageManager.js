'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  DollarSign, 
  Clock, 
  Users, 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  Printer, 
  ArrowRight, 
  Calendar,
  ChevronRight,
  UserCheck,
  Briefcase
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';
import StaffWageSheetView from './StaffWageSheetView';
import WageManualEntryModal from './WageManualEntryModal';

export default function WageManager({ title = 'Wages & Timesheets Oversight' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);

  // Tab State: 'overview' | 'clock-in' | 'manual' | 'amendments' | 'staff-detail'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  // Filters
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Data states
  const [wageSheets, setWageSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showManualModal, setShowManualModal] = useState(false);

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    } else if (!token) {
      router.push('/login');
      return;
    }

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setCurrentUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(err => console.error('Error verifying user session:', err));
    }
  }, [router]);

  useEffect(() => {
    if (tabParam && ['overview', 'clock-in', 'manual', 'amendments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    setSelectedStaffId(null);
    router.push(`/admin/wages?tab=${t}`, { scroll: false });
  };

  const fetchWages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `/api/wages?year=${year}`;
      if (month && month !== 'ALL') url += `&month=${month}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setWageSheets(data.wageSheets || []);
      }
    } catch (err) {
      console.error('Error fetching wages:', err);
      setNotification({ show: true, message: 'Failed to load wage data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchWages();
  }, [fetchWages]);

  // Filtered sheets
  const filteredSheets = useMemo(() => {
    return wageSheets.filter(ws => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = ws.user.name.toLowerCase();
        const role = ws.user.role.toLowerCase();
        const empNo = (ws.user.employeeNumber || '').toLowerCase();
        return name.includes(q) || role.includes(q) || empNo.includes(q);
      }
      return true;
    });
  }, [wageSheets, searchTerm]);

  // Overall totals
  const totalStats = useMemo(() => {
    let grossTotal = 0;
    let totalHours = 0;
    let pendingAmendments = 0;
    let totalAdjustments = 0;

    wageSheets.forEach(ws => {
      grossTotal += ws.summary.grossPay;
      totalHours += ws.summary.totalHours;
      totalAdjustments += ws.summary.manualAdjustmentsTotal;
      if (ws.amendmentRequests) {
        pendingAmendments += ws.amendmentRequests.filter(r => r.status === 'PENDING').length;
      }
    });

    return {
      grossTotal,
      totalHours: Math.round(totalHours * 10) / 10,
      staffCount: wageSheets.length,
      pendingAmendments,
      totalAdjustments
    };
  }, [wageSheets]);

  // Selected single staff sheet
  const selectedSheet = useMemo(() => {
    if (!selectedStaffId) return null;
    return wageSheets.find(ws => ws.user.id === selectedStaffId);
  }, [wageSheets, selectedStaffId]);

  // All manual entries combined
  const allManualEntries = useMemo(() => {
    const list = [];
    wageSheets.forEach(ws => {
      (ws.manualEntries || []).forEach(me => {
        list.push({ ...me, userName: ws.user.name, userRole: ws.user.role, userId: ws.user.id });
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [wageSheets]);

  // All amendments combined
  const allAmendments = useMemo(() => {
    const list = [];
    wageSheets.forEach(ws => {
      (ws.amendmentRequests || []).forEach(req => {
        list.push({ ...req, userName: ws.user.name, userRole: ws.user.role, userRate: ws.user.rateOfPay, userId: ws.user.id });
      });
    });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [wageSheets]);

  const handleReviewAmendment = async (id, status) => {
    const managerNotes = prompt(`Enter optional manager notes for ${status.toLowerCase()} request:`) || '';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wages/amendments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, status, managerNotes })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ show: true, message: data.message, type: 'success' });
        fetchWages();
      } else {
        alert(data.error || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating request');
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Payroll Overview', icon: Users, badge: `${wageSheets.length} Staff` },
    { id: 'clock-in', label: 'Rota & Clock-In Hours', icon: Clock },
    { id: 'manual', label: 'Manual Adjustments', icon: DollarSign, badge: `${allManualEntries.length}` },
    { id: 'amendments', label: 'Amendment Requests', icon: FileText, badge: totalStats.pendingAmendments > 0 ? `${totalStats.pendingAmendments} Due` : null, badgeColor: 'bg-amber-500 text-white' },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={currentUser} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={currentUser} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
                  Comprehensive wage management & clock-in tracking. Management & Admin have full oversight across all staff sheets; staff can access their own sheet in read-only mode.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173a7a] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#224fa6]" />
                  <span>Manual Adjustment</span>
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Management Oversight
                </span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Gross Payroll</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">
                £{totalStats.grossTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Calculated from hours & rates</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173a7a] uppercase tracking-wider">Total Clocked Hours</span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#224fa6]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">{totalStats.totalHours} hrs</p>
              <p className="text-xs text-gray-500 font-medium mt-1">From clock in/out sessions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Staff On Payroll</span>
                <div className="p-2 rounded-xl bg-gray-50 text-gray-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">{totalStats.staffCount}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Active staff members</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Amendment Requests</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 mt-2">{totalStats.pendingAmendments}</p>
              <p className="text-xs text-amber-700 font-medium mt-1">Awaiting manager approval</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {navTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id && !selectedStaffId;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {t.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#224fa6]')
                      }`}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pay Period Selector */}
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-medium bg-white"
              >
                <option value="ALL">All Months (Year {year})</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-medium bg-white"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          {/* Main Content Areas */}
          {selectedStaffId ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedStaffId(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#224fa6] hover:underline cursor-pointer"
              >
                ← Back to Staff Payroll Overview
              </button>
              <StaffWageSheetView
                wageSheet={selectedSheet}
                isManager={true}
                onDataChanged={fetchWages}
              />
            </div>
          ) : activeTab === 'overview' ? (
            /* Staff Overview Table */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search staff name or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Click any staff row to open their full timesheet & breakdown</span>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-semibold text-gray-500">Calculating staff wages and timesheets...</p>
                </div>
              ) : filteredSheets.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No staff wage records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Base Rate</th>
                        <th className="py-3 px-4 text-center">Reg. Hours</th>
                        <th className="py-3 px-4 text-center">Standby</th>
                        <th className="py-3 px-4 text-center">Sleep In</th>
                        <th className="py-3 px-4 text-center">Total Hrs</th>
                        <th className="py-3 px-4 text-right">Manual Adj.</th>
                        <th className="py-3 px-4 text-right">Gross Pay</th>
                        <th className="py-3 px-4 text-center">Amendments</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {filteredSheets.map((ws) => {
                        const pendingReqs = (ws.amendmentRequests || []).filter(r => r.status === 'PENDING').length;

                        return (
                          <tr
                            key={ws.user.id}
                            onClick={() => setSelectedStaffId(ws.user.id)}
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#173a7a] font-bold flex items-center justify-center text-xs">
                                  {ws.user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{ws.user.name}</p>
                                  <p className="text-[10px] text-gray-500">{ws.user.role} • {ws.user.employeeNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-700">
                              £{ws.user.rateOfPay.toFixed(2)}/hr
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {ws.summary.regularHours}h
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {ws.summary.standbyHours}h
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {ws.summary.sleepingNightShifts}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-blue-700">
                              {ws.summary.totalHours}h
                            </td>
                            <td className={`py-3 px-4 text-right whitespace-nowrap font-bold ${ws.summary.manualAdjustmentsTotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {ws.summary.manualAdjustmentsTotal >= 0 ? '+' : ''}£{ws.summary.manualAdjustmentsTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap font-black text-sm text-gray-900">
                              £{ws.summary.grossPay.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {pendingReqs > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold ring-1 ring-amber-300">
                                  {pendingReqs} Pending
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <span className="text-[#224fa6] font-bold text-xs flex items-center justify-end gap-1">
                                View Sheet <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'manual' ? (
            /* All Manual Adjustments */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Organization-Wide Manual Wage Entries ({allManualEntries.length})</h4>
                  <p className="text-xs text-gray-500">Overtime, bonuses, holiday pay, and manual shift hours</p>
                </div>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#224fa6] text-white rounded-xl text-xs font-bold hover:bg-[#1a3d82] transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Adjustment</span>
                </button>
              </div>

              {allManualEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No manual adjustments recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Staff Member</th>
                        <th className="py-2.5 px-4">Adjustment Type</th>
                        <th className="py-2.5 px-4">Hours</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {allManualEntries.map((me) => (
                        <tr key={me.id} className="hover:bg-blue-50/30">
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                            {new Date(me.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                            {me.userName} <span className="text-[10px] text-gray-500 font-normal">({me.userRole})</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#173a7a] border border-blue-200">
                              {me.entryType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{me.hours ? `${me.hours} hrs` : '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{me.description}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-black text-emerald-600 text-sm">
                            +£{me.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'amendments' ? (
            /* All Amendments */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Staff Amendment Review Queue ({allAmendments.length})</h4>
                  <p className="text-xs text-gray-500">Staff members can only request amendments; only management can approve or reject</p>
                </div>
              </div>

              {allAmendments.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No amendment requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                        <th className="py-2.5 px-4">Request Date</th>
                        <th className="py-2.5 px-4">Staff Member</th>
                        <th className="py-2.5 px-4">Shift Date</th>
                        <th className="py-2.5 px-4">Requested Details</th>
                        <th className="py-2.5 px-4">Reason / Notes</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Manager Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {allAmendments.map((req) => (
                        <tr key={req.id} className="hover:bg-blue-50/30">
                          <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                            {new Date(req.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                            {req.userName} <span className="text-[10px] text-gray-500 font-normal">({req.userRole})</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold">
                            {req.shiftDate ? new Date(req.shiftDate).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {req.requestedHours ? <span className="font-bold">{req.requestedHours} hrs</span> : ''}
                            {req.requestedAmount ? <span className="ml-1 text-emerald-700 font-bold">(£{req.requestedAmount.toFixed(2)})</span> : ''}
                          </td>
                          <td className="py-3 px-4 text-gray-700 max-w-xs">{req.reason}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                              req.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-800 animate-pulse'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleReviewAmendment(req.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewAmendment(req.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Clock In Tab */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
              <h4 className="font-bold text-sm text-gray-900 mb-2">Clock-In Integration Details</h4>
              <p className="text-xs text-gray-600">
                Wages automatically compute hours directly from employee clock-in and clock-out timestamps, factoring in regular shifts, standby shifts, and sleeping nights allowances according to each staff member's contract rate of pay.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/admin/clock-in-out')}
                  className="px-4 py-2 bg-[#224fa6] text-white rounded-xl text-xs font-bold hover:bg-[#1a3d82] transition-colors"
                >
                  Go to Live Clock-In System →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Manual Entry Modal */}
      <WageManualEntryModal
        isOpen={showManualModal}
        staffList={wageSheets.map(ws => ws.user)}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => {
          setNotification({ show: true, message: 'Wage adjustment applied successfully', type: 'success' });
          fetchWages();
        }}
      />

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
}
