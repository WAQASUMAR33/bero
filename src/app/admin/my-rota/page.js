'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function MyRotaPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [view, setView] = useState('daily'); // 'daily' | 'weekly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyShifts();
    }
  }, [user, currentDate, view]);

  const fetchMyShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateParam = view === 'daily' 
        ? `date=${currentDate.toISOString().split('T')[0]}`
        : `week=${getWeekStart(currentDate).toISOString().split('T')[0]}`;
      
      const res = await fetch(`/api/shifts?view=my&${dateParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setShifts([]);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

  const getShiftsForTimeSlot = (date, hour) => {
    return shifts.filter(shift => {
      const shiftStartHour = parseInt(shift.startTime.split(':')[0]);
      const shiftEndHour = parseInt(shift.endTime.split(':')[0]);
      
      // Check if this hour falls within the shift time
      const isInTimeRange = hour >= shiftStartHour && hour < shiftEndHour;
      if (!isInTimeRange) return false;

      // Check if shift occurs on this date based on recurrence
      const fromDate = new Date(shift.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const untilDate = shift.untilDate ? new Date(shift.untilDate) : null;
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

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

  // Calculate total hours
  const totalHours = shifts.reduce((acc, shift) => {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    let hours = endHour - startHour;
    const minutes = endMin - startMin;
    hours += minutes / 60;
    if (hours < 0) hours += 24;
    return acc + hours;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rota</h1>
            <p className="text-gray-600">View your assigned shifts</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Shifts</p>
                  <p className="text-3xl font-bold text-gray-900">{shifts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical Shifts</p>
                  <p className="text-3xl font-bold text-gray-900">{shifts.filter(s => s.timeCritical).length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView('daily')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view === 'daily'
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setView('weekly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view === 'weekly'
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
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header */}
                <div className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(200px, 1fr))` }}>
                  <div className="bg-gray-50 border-b border-r border-gray-200 p-3 font-semibold text-gray-700">
                    Time
                  </div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="bg-gray-50 border-b border-gray-200 p-3 text-center">
                      <div className="font-semibold text-gray-900">
                        {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {hours.map(hour => (
                  <div key={hour} className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(200px, 1fr))` }}>
                    <div className="border-b border-r border-gray-200 p-3 text-sm font-medium text-gray-600 bg-gray-50">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {weekDays.map((day, idx) => {
                      const shiftsInSlot = getShiftsForTimeSlot(day, hour);
                      return (
                        <div key={idx} className="border-b border-gray-200 p-2 min-h-[60px]">
                          {shiftsInSlot.map(shift => (
                            <div
                              key={shift.id}
                              className="mb-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500"
                            >
                              <div className="font-semibold text-sm text-gray-900">
                                {shift.serviceSeeker.preferredName || shift.serviceSeeker.firstName} {shift.serviceSeeker.lastName}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <div className="text-xs text-purple-700 mt-1 font-medium">
                                {shift.shiftType.name}
                              </div>
                              {shift.timeCritical && (
                                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Critical
                                </div>
                              )}
                              {shift.notesForCarers && (
                                <div className="text-xs text-gray-600 mt-2 italic">
                                  📝 {shift.notesForCarers}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

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

