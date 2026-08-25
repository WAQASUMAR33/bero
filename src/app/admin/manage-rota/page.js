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
        ? `date=${currentDate.toISOString().split('T')[0]}`
        : `week=${getWeekStart(currentDate).toISOString().split('T')[0]}`;

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

    const matchingShifts = shifts.filter(shift => {

      // Check if shift occurs on this date based on recurrence
      const fromDate = new Date(shift.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const untilDate = shift.untilDate ? new Date(shift.untilDate) : null;

      // Check if date is within the shift's date range
      if (checkDate < fromDate) return false;
      if (untilDate && checkDate > untilDate) return false;

      // Check recurrence pattern
      const daysDiff = Math.floor((checkDate - fromDate) / (1000 * 60 * 60 * 24));

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

    // Remove duplicates by shift ID (in case same shift appears multiple times)
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
      // Filter assignments to only show ones for the current date
      const dateStr = checkDate.toISOString().split('T')[0];
      const filteredAssignments = shift.assignments?.filter(assignment => {
        const assignmentDate = new Date(assignment.date);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate.getTime() === checkDate.getTime();
      }) || [];

      // Remove duplicate assignments (same user on same date)
      const uniqueAssignments = [];
      const seenUserIds = new Set();
      for (const assignment of filteredAssignments) {
        if (!seenUserIds.has(assignment.userId)) {
          seenUserIds.add(assignment.userId);
          uniqueAssignments.push(assignment);
        }
      }

      return {
        ...shift,
        assignments: uniqueAssignments
      };
    });

    // Sort shifts by start time, then by service seeker name
    return shiftsWithFilteredAssignments.sort((a, b) => {
      const aStart = a.startTime;
      const bStart = b.startTime;
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      // If same start time, sort by service seeker name
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

  const weekDays = view === 'weekly' ? getWeekDays(getWeekStart(currentDate)) : [currentDate];

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
                  const rowHeight = Math.max(80, maxLanes * 70 + 20);

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
                          const widthPerc = (durationMins / totalMins) * 100;
                          const topPos = shift._lane * 70 + 10;
                          const colorVariants = [
                            'from-blue-50 to-blue-100 border-blue-500',
                            'from-purple-50 to-purple-100 border-purple-500',
                            'from-green-50 to-green-100 border-green-500',
                            'from-yellow-50 to-yellow-100 border-yellow-500',
                            'from-pink-50 to-pink-100 border-pink-500',
                          ];
                          const colorClass = colorVariants[shiftIdx % colorVariants.length];

                          return (
                              <div
                                key={`shift-${shift.id}-${shiftIdx}`}
                                onClick={() => handleShiftClick && handleShiftClick(shift, day)}
                                className={`absolute p-2 rounded-lg bg-gradient-to-r ${colorClass} border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm overflow-hidden z-10 flex flex-col justify-center`}
                                style={{
                                    left: `${startPerc}%`,
                                    width: `${widthPerc}%`,
                                    top: `${topPos}px`,
                                    height: '60px',
                                }}
                                title={`Shift: ${shift.serviceSeeker?.preferredName || shift.serviceSeeker?.firstName} ${shift.serviceSeeker?.lastName} - ${shift.startTime} to ${shift.endTime}`}
                              >
                                  <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                                      {shift.serviceSeeker?.firstName} {shift.serviceSeeker?.lastName}
                                      {shift.timeCritical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1"></span>}
                                  </div>
                                  <div className="text-xs text-gray-700 truncate">
                                      {shift.startTime} - {shift.endTime} | {shift.shiftType?.name}
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
