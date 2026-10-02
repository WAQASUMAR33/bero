'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import CreateShiftModal from './components/CreateShiftModal';
import { hasPermission } from '@/lib/permissions';

export default function ManageRotaPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [funders, setFunders] = useState([]);
  const [shiftRuns, setShiftRuns] = useState([]);
  const [view, setView] = useState('daily'); // 'daily' | 'weekly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingShift, setEditingShift] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unassigned' | 'filled'

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchShifts();
      fetchServiceSeekers();
      fetchStaff();
      fetchShiftTypes();
      fetchFunders();
      fetchShiftRuns();
    }
  }, [user, currentDate, view]);

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateParam = view === 'daily'
        ? `date=${formatLocalDate(currentDate)}`
        : `week=${formatLocalDate(getWeekStart(currentDate))}`;

      const res = await fetch(`/api/shifts?view=all&${dateParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShifts([]);
    }
  };

  const fetchServiceSeekers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/service-seekers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setServiceSeekers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setServiceSeekers([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const transformed = data
        .filter((user) => user.status === 'CURRENT')
        .map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePic: user.profilePic,
          role: user.role?.displayName || user.role?.name || null,
          teamId: user.teamId || null,
          team: user.team?.name || null,
        }));

      setStaff(transformed);
    } catch (e) {
      console.error(e);
      setStaff([]);
    }
  };

  const fetchShiftTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shift-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShiftTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShiftTypes([]);
    }
  };

  const fetchFunders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/funders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      // Handle both direct array and {success, data} format
      const fundersData = result.success ? result.data : (Array.isArray(result) ? result : []);
      // Transform to match our needs
      const transformedFunders = fundersData.map(f => ({
        id: f.id,
        fundingSource: f.name || f.fundingSource,
        contractNumber: f.contractNumber,
        serviceType: f.serviceType,
        paymentType: f.paymentType
      }));
      setFunders(transformedFunders);
    } catch (e) {
      console.error(e);
      setFunders([]);
    }
  };

  const fetchShiftRuns = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shift-runs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShiftRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShiftRuns([]);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleShiftClick = (shift, day) => {
    if (hasPermission(user, 'shifts.update') || hasPermission(user, 'shifts.delete')) {
      const selectedDateStr = day ? new Date(day).toISOString().split('T')[0] : (currentDate ? currentDate.toISOString().split('T')[0] : null);
      setEditingShift({
        ...shift,
        _selectedDate: selectedDateStr
      });
      setShowCreateModal(true);
    }
  };

  const handleCreateNew = () => {
    setEditingShift(null);
    setShowCreateModal(true);
  };

  const handleShiftSaved = () => {
    setShowCreateModal(false);
    setEditingShift(null);
    fetchShifts();
    fetchStaff();
    setNotification({
      show: true,
      message: editingShift ? 'Shift updated successfully!' : 'Shift created successfully!',
      type: 'success'
    });
  };

  const handleShiftDeleted = (message = 'Shift deleted successfully!') => {
    setShowCreateModal(false);
    setEditingShift(null);
    fetchShifts();
    fetchStaff();
    setNotification({
      show: true,
      message,
      type: 'success'
    });
  };

  const processLanes = (shiftsForDay) => {
    const lanes = [];
    const result = [];
    shiftsForDay.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      let [endH, endM] = shift.endTime.split(':').map(Number);
      let startMins = startH * 60 + startM;
      let endMins = endH * 60 + endM;
      if (endMins <= startMins) endMins += 24 * 60;
      let laneIdx = 0;
      while (true) {
        const lane = lanes[laneIdx] || [];
        if (!lane.some(s => Math.max(startMins, s.start) < Math.min(endMins, s.end))) {
          lanes[laneIdx] = [...lane, { start: startMins, end: endMins }];
          result.push({ ...shift, _lane: laneIdx, _start: startMins, _end: endMins });
          break;
        }
        laneIdx++;
      }
    });
    return result;
  };

  const getShiftsForDate = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();

    const matchingShifts = shifts.filter(shift => {
      // Check if shift occurs on this date based on recurrence
      const fromDate = new Date(shift.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const untilDate = shift.untilDate ? new Date(shift.untilDate) : null;

      // Check if date is within the shift's date range
      if (checkDate < fromDate) return false;
      if (untilDate && checkDate > untilDate) return false;

      // Check recurrence pattern (Math.round handles daylight savings)
      const daysDiff = Math.round((checkDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (shift.recurrence) {
        case 'DAILY':
          return true;
        case 'WEEK':
          return daysDiff % 7 === 0;
        case 'TWO_WEEK':
          return daysDiff % 14 === 0;
        case 'THREE_WEEK':
          return daysDiff % 21 === 0;
        case 'FOUR_WEEK':
          return daysDiff % 28 === 0;
        case 'FIVE_WEEK':
          return daysDiff % 35 === 0;
        case 'SIX_WEEK':
          return daysDiff % 42 === 0;
        case 'SEVEN_WEEK':
          return daysDiff % 49 === 0;
        case 'EIGHT_WEEK':
          return daysDiff % 56 === 0;
        case 'NINE_WEEK':
          return daysDiff % 63 === 0;
        case 'TEN_WEEK':
          return daysDiff % 70 === 0;
        case 'TWO_DAY':
          return daysDiff % 2 === 0;
        case 'THREE_DAY':
          return daysDiff % 3 === 0;
        case 'FOUR_DAY':
          return daysDiff % 4 === 0;
        case 'FIVE_DAY':
          return daysDiff % 5 === 0;
        case 'SIX_DAY':
          return daysDiff % 6 === 0;
        default:
          return false;
      }
    });

    // Remove duplicates by shift ID
    const uniqueShifts = [];
    const seenShiftIds = new Set();
    for (const shift of matchingShifts) {
      if (!seenShiftIds.has(shift.id)) {
        seenShiftIds.add(shift.id);
        uniqueShifts.push(shift);
      }
    }

    // Filter assignments to only show ones for the current date
    const shiftsWithFilteredAssignments = uniqueShifts.map(shift => {
      const filteredAssignments = (shift.assignments || []).filter(assignment => {
        if (!assignment || !assignment.date) return false;
        const ad = new Date(assignment.date);
        const localMatch = ad.getFullYear() === checkYear && ad.getMonth() === checkMonth && ad.getDate() === checkDay;
        const utcMatch = ad.getUTCFullYear() === checkYear && ad.getUTCMonth() === checkMonth && ad.getUTCDate() === checkDay;
        return localMatch || utcMatch;
      });

      // Remove duplicate assignments (same user on same date)
      const uniqueAssignments = [];
      const seenUserIds = new Set();
      for (const assignment of filteredAssignments) {
        if (!seenUserIds.has(assignment.userId)) {
          seenUserIds.add(assignment.userId);
          uniqueAssignments.push(assignment);
        }
      }

      const requiredStaff = shift.totalStaffRequired ? parseInt(shift.totalStaffRequired, 10) : 1;
      const isFilled = uniqueAssignments.length >= requiredStaff;

      return {
        ...shift,
        assignments: uniqueAssignments,
        _requiredStaff: requiredStaff,
        _assignedCount: uniqueAssignments.length,
        _isFilled: isFilled
      };
    });

    // Apply statusFilter if selected
    let result = shiftsWithFilteredAssignments;
    if (statusFilter === 'unassigned') {
      result = shiftsWithFilteredAssignments.filter(s => !s._isFilled);
    } else if (statusFilter === 'filled') {
      result = shiftsWithFilteredAssignments.filter(s => s._isFilled);
    }

    // Sort shifts by start time, then by service seeker name
    return result.sort((a, b) => {
      const aStart = a.startTime;
      const bStart = b.startTime;
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      const aName = a.serviceSeeker?.preferredName || a.serviceSeeker?.firstName || '';
      const bName = b.serviceSeeker?.preferredName || b.serviceSeeker?.firstName || '';
      return aName.localeCompare(bName);
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Please log in to access this page.</div>
      </div>
    );
  }

  const displayDate = view === 'daily'
    ? currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `Week of ${getWeekStart(currentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const getShiftIsFilled = (shift, checkDate) => {
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();

    const filteredAssignments = (shift.assignments || []).filter(assignment => {
      if (!assignment || !assignment.date) return false;
      const ad = new Date(assignment.date);
      return (ad.getFullYear() === checkYear && ad.getMonth() === checkMonth && ad.getDate() === checkDay) ||
             (ad.getUTCFullYear() === checkYear && ad.getUTCMonth() === checkMonth && ad.getUTCDate() === checkDay);
    });

    const uniqueUserIds = new Set(filteredAssignments.map(a => a.userId));
    const requiredStaff = shift.totalStaffRequired ? parseInt(shift.totalStaffRequired, 10) : 1;
    return uniqueUserIds.size >= requiredStaff;
  };

  const weekDays = view === 'weekly' ? getWeekDays(getWeekStart(currentDate)) : [currentDate];

  let totalShiftsCount = 0;
  let filledShiftsCount = 0;
  let unassignedShiftsCount = 0;

  weekDays.forEach(day => {
    const checkDate = new Date(day);
    checkDate.setHours(0, 0, 0, 0);

    const matchingShifts = shifts.filter(shift => {
      const fromDate = new Date(shift.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const untilDate = shift.untilDate ? new Date(shift.untilDate) : null;
      if (checkDate < fromDate) return false;
      if (untilDate && checkDate > untilDate) return false;
      const daysDiff = Math.round((checkDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (shift.recurrence) {
        case 'DAILY': return true;
        case 'WEEK': return daysDiff % 7 === 0;
        case 'TWO_WEEK': return daysDiff % 14 === 0;
        case 'THREE_WEEK': return daysDiff % 21 === 0;
        case 'FOUR_WEEK': return daysDiff % 28 === 0;
        case 'FIVE_WEEK': return daysDiff % 35 === 0;
        case 'SIX_WEEK': return daysDiff % 42 === 0;
        case 'SEVEN_WEEK': return daysDiff % 49 === 0;
        case 'EIGHT_WEEK': return daysDiff % 56 === 0;
        case 'NINE_WEEK': return daysDiff % 63 === 0;
        case 'TEN_WEEK': return daysDiff % 70 === 0;
        case 'TWO_DAY': return daysDiff % 2 === 0;
        case 'THREE_DAY': return daysDiff % 3 === 0;
        case 'FOUR_DAY': return daysDiff % 4 === 0;
        case 'FIVE_DAY': return daysDiff % 5 === 0;
        case 'SIX_DAY': return daysDiff % 6 === 0;
        default: return false;
      }
    });

    const seenIds = new Set();
    matchingShifts.forEach(shift => {
      if (!seenIds.has(shift.id)) {
        seenIds.add(shift.id);
        totalShiftsCount++;
        if (getShiftIsFilled(shift, checkDate)) {
          filledShiftsCount++;
        } else {
          unassignedShiftsCount++;
        }
      }
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 min-w-0 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Rota</h1>
            <p className="text-gray-600">Schedule and manage staff shifts</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView('daily')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'daily'
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setView('weekly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'weekly'
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Weekly
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevious}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-center min-w-[250px]">
                  <div className="text-lg font-semibold text-gray-900">{displayDate}</div>
                </div>

                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={handleToday}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                >
                  Today
                </button>
              </div>

              {/* Create Shift Button */}
              {hasPermission(user, 'shifts.create') && (
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Shift
                </button>
              )}
            </div>
          </div>

          {/* Rota Summary & Status Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Metric 1: Total */}
            <div
              onClick={() => setStatusFilter('all')}
              className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow ${
                statusFilter === 'all' ? 'border-[#224fa6] ring-2 ring-[#224fa6]/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Shifts</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900">{totalShiftsCount}</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {view === 'daily' ? 'Today' : 'This Week'}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Click to view all shifts</div>
            </div>

            {/* Metric 2: Unassigned / Unfilled (RED) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'unassigned' ? 'all' : 'unassigned')}
              className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow ${
                statusFilter === 'unassigned'
                  ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/40'
                  : 'border-gray-200 hover:border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Unassigned Shifts
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">RED</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-red-600">{unassignedShiftsCount}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  unassignedShiftsCount > 0 ? 'bg-red-100 text-red-700 font-semibold' : 'bg-gray-100 text-gray-600'
                }`}>
                  {unassignedShiftsCount === 1 ? 'Needs Cover' : 'Need Cover'}
                </span>
              </div>
              <div className="text-[11px] text-red-500/80 mt-1">
                {statusFilter === 'unassigned' ? 'Showing unassigned only (click to reset)' : 'Click to filter unassigned only'}
              </div>
            </div>

            {/* Metric 3: Filled (GREEN) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'filled' ? 'all' : 'filled')}
              className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow ${
                statusFilter === 'filled'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                  : 'border-gray-200 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Filled Shifts
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">GREEN</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{filledShiftsCount}</span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Fully Staffed
                </span>
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-1">
                {statusFilter === 'filled' ? 'Showing filled only (click to reset)' : 'Click to filter filled only'}
              </div>
            </div>

            {/* Metric 4: Legend */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Rota Color Guide</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500 border border-red-600 flex-shrink-0"></span>
                  <span className="font-semibold text-red-800">Red:</span>
                  <span className="text-gray-700 truncate">Unassigned / Needs Staff</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600 flex-shrink-0"></span>
                  <span className="font-semibold text-emerald-800">Green:</span>
                  <span className="text-gray-700 truncate">Filled / Staff Covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
                  <span className="text-gray-600 text-[11px]">Pulsing Dot: Time Critical</span>
                </div>
              </div>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold text-left mt-2 underline"
                >
                  Show All Shifts
                </button>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8 mx-auto w-full">
            <div className="overflow-x-auto pb-4">
              <div style={{ width: '3800px' }} className="relative bg-white">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-30">
                  <div className="w-[120px] flex-shrink-0 border-r border-gray-200 p-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-40">
                    Day / Time
                  </div>
                  {hours.map(hour => (
                    <div key={hour} className="flex-1 border-r border-gray-200 p-3 text-center">
                      <div className="font-semibold text-gray-900">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {weekDays.map((day, idx) => {
                  const dayShifts = getShiftsForDate(day);
                  const processedShifts = processLanes(dayShifts);
                  const maxLanes = processedShifts.length > 0 ? Math.max(...processedShifts.map(s => s._lane)) + 1 : 1;
                  const rowHeight = Math.max(90, maxLanes * 76 + 20);

                  return (
                    <div key={idx} className="flex relative border-b border-gray-200 group" style={{ height: `${rowHeight}px` }}>
                      
                      {/* Fixed Day Label */}
                      <div className="w-[120px] flex-shrink-0 border-r border-gray-200 bg-gray-50 sticky left-0 z-20 flex flex-col justify-center items-center text-center p-2 border-b-white">
                        <div className="font-semibold text-gray-900">
                          {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 font-medium">
                          {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                        </div>
                      </div>

                      {/* Hour slots background */}
                      <div className="flex flex-1 relative">
                        {hours.map(hour => (
                          <div key={hour} className="flex-1 border-r border-gray-100 bg-white group-hover:bg-gray-50/50 transition-colors"></div>
                        ))}

                        {/* Absolute positioned shifts */}
                        {processedShifts.map((shift, shiftIdx) => {
                          const totalMins = 24 * 60;
                          const startPerc = (shift._start / totalMins) * 100;
                          const durationMins = Math.min(totalMins, shift._end - shift._start);
                          const widthPerc = Math.max(3, (durationMins / totalMins) * 100);
                          const topPos = shift._lane * 76 + 8;
                          const isFilled = Boolean(shift._isFilled);
                          const assignedStaffNames = (shift.assignments || [])
                            .map(a => a.user ? `${a.user.firstName} ${a.user.lastName}` : null)
                            .filter(Boolean);

                          return (
                            <div
                              key={`shift-${shift.id}-${shiftIdx}`}
                              onClick={() => handleShiftClick && handleShiftClick(shift, day)}
                              className={`absolute p-2.5 rounded-xl cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm overflow-hidden z-10 flex flex-col justify-between border-l-4 ${
                                isFilled
                                  ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-100/90 border-l-emerald-600 border-t border-r border-b border-emerald-200 text-emerald-950 hover:from-emerald-100 hover:to-green-200'
                                  : 'bg-gradient-to-r from-red-50 via-rose-50 to-red-100/90 border-l-red-600 border-t border-r border-b border-red-200 text-red-950 hover:from-red-100 hover:to-rose-200'
                              }`}
                              style={{
                                left: `${startPerc}%`,
                                width: `${widthPerc}%`,
                                top: `${topPos}px`,
                                height: '66px',
                              }}
                              title={`Shift: ${shift.serviceSeeker?.preferredName || shift.serviceSeeker?.firstName} ${shift.serviceSeeker?.lastName}\nTime: ${shift.startTime} - ${shift.endTime} (${shift.shiftType?.name || 'Standard'})\nStatus: ${isFilled ? `FILLED (${assignedStaffNames.join(', ')})` : `UNASSIGNED (${shift._assignedCount}/${shift._requiredStaff} staff) - Click to assign`}${shift.timeCritical ? '\n• TIME CRITICAL' : ''}`}
                            >
                              {/* Top row: Client name + critical indicator + status badge */}
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                <div className="font-bold text-xs truncate flex items-center gap-1">
                                  <span className="truncate">
                                    {shift.serviceSeeker?.preferredName || shift.serviceSeeker?.firstName} {shift.serviceSeeker?.lastName}
                                  </span>
                                  {shift.timeCritical && (
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" title="Time Critical" />
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 border ${
                                    isFilled
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-red-100 text-red-800 border-red-300'
                                  }`}
                                >
                                  {isFilled ? (
                                    <>
                                      <svg className="w-2.5 h-2.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      <span>Filled</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                      <span>Unassigned</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Middle row: Time range + Shift type */}
                              <div className="text-[11px] truncate opacity-90 flex items-center gap-1 font-medium">
                                <span>{shift.startTime} - {shift.endTime}</span>
                                {shift.shiftType?.name && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate">{shift.shiftType.name}</span>
                                  </>
                                )}
                              </div>

                              {/* Bottom row: Assigned staff or Action callout */}
                              <div className="text-[10px] truncate flex items-center gap-1">
                                {isFilled ? (
                                  <div className="text-emerald-800 font-medium truncate flex items-center gap-1">
                                    <svg className="w-3 h-3 flex-shrink-0 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">
                                      {assignedStaffNames.join(', ') || 'Staff assigned'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-red-700 font-semibold truncate flex items-center gap-1">
                                    <svg className="w-3 h-3 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">
                                      {shift._assignedCount > 0
                                        ? `Needs ${shift._requiredStaff - shift._assignedCount} more staff · Click to assign`
                                        : 'Unassigned (0/' + shift._requiredStaff + ') · Click to assign'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                );
              })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Shift Modal */}
      {showCreateModal && (
        <CreateShiftModal
          shift={editingShift}
          serviceSeekers={serviceSeekers}
          staff={staff}
          shiftTypes={shiftTypes}
          funders={funders}
          shiftRuns={shiftRuns}
          onClose={() => {
            setShowCreateModal(false);
            setEditingShift(null);
          }}
          onSaved={handleShiftSaved}
          onDeleted={handleShiftDeleted}
          onShiftRunCreated={fetchShiftRuns}
          onShiftTypeCreated={fetchShiftTypes}
        />
      )}

      {/* Notification */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
}
