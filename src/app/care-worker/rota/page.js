'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RotaPage() {
    // Start with current week's Monday
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchShifts();
    }, [currentWeekStart]);

    const fetchShifts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Format date as YYYY-MM-DD for API
            const dateStr = currentWeekStart.toISOString().split('T')[0];

            const response = await fetch(`/api/shifts?view=my&week=${dateStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // The API returns the array directly properly per docs
                // "Response - Enhanced... [ {...} ]"
                // But let's check if it returns { success, data } or just array based on other endpoints pattern vs doc.
                // Doc says: [ { ... } ]
                // But previous experience with this project suggests { success: true, data: [] } often.
                // Let's assume the doc is correct but handle both if possible or stick to doc.
                // Actually in the doc earlier sections it was { data: [] } for holidays.
                // For shifts, the example json shows just an array `[ { ... } ]`.
                // However, I recall accessing `data.data` in `fetchShifts` on dashboard.
                // Let's verify dashboard code for `fetchShifts`...
                // Dashboard: `const response = await fetch(\`/api/clock-in-out/my-shifts?date=\${today}\`...`
                // That is a different endpoint `/api/clock-in-out/my-shifts`.
                // Mobile API doc says `GET /api/shifts?view=my`.
                // Let's adhere to the doc for `GET /api/shifts`.

                if (Array.isArray(data)) {
                    setShifts(data);
                } else if (data.data && Array.isArray(data.data)) {
                    setShifts(data.data);
                } else {
                    setShifts([]);
                }
            } else {
                setError('Failed to load shifts');
            }
        } catch (err) {
            console.error(err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleWeekChange = (direction) => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentWeekStart(newDate);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    // Helper to group shifts by day
    const getDaysOfWeek = () => {
        const days = [];
        const start = new Date(currentWeekStart);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getDaysOfWeek();

    const getShiftsForDay = (dateObj) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        return shifts.filter(s => {
            // Need to match the assigned date. 
            // API Doc: "fromDate": "2024-01-15T00:00:00.000Z"
            // Also "assignmentDate" if distinct?
            // Usually we use `fromDate` or `assignmentDate` field if available.
            // API Response has `assignmentDate`.
            const shiftDate = s.assignmentDate
                ? s.assignmentDate.split('T')[0]
                : s.fromDate.split('T')[0];
            return shiftDate === dateStr;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getStatusColor = (shift) => {
        if (shift.clockOutTime) return 'bg-green-100 text-green-700 border-green-200';
        if (shift.clockedIn) return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-white border-gray-200 hover:border-[#224fa6]';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                        onClick={() => handleWeekChange(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-bold text-gray-900 text-center min-w-[180px]">
                        {new Date(currentWeekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} - {
                            new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
                        }
                    </h2>
                    <button
                        onClick={() => handleWeekChange(1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentWeekStart(getMonday(new Date()))}
                        className="text-sm font-semibold text-[#224fa6] px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            )}

            {/* Calendar Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]" />
                    </div>
                ) : (
                    weekDays.map((day) => {
                        const dayShifts = getShiftsForDay(day);
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                            <div key={day.toISOString()} className={`rounded-xl border transition-all ${isToday ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-gray-100'}`}>
                                <div className="p-4 flex flex-col md:flex-row gap-4 md:gap-8">
                                    {/* Date Column */}
                                    <div className="md:w-32 flex-shrink-0 flex md:flex-col items-center md:items-start justify-between md:justify-center">
                                        <div className="flex items-center gap-2 md:block">
                                            <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-[#224fa6]' : 'text-gray-400'}`}>
                                                {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                                            </span>
                                            <span className={`text-2xl md:text-3xl font-bold ml-2 md:ml-0 md:mt-1 ${isToday ? 'text-[#224fa6]' : 'text-gray-900'}`}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                        {dayShifts.length === 0 && (
                                            <span className="text-xs text-gray-400 font-medium md:mt-2 bg-gray-50 px-2 py-0.5 rounded">
                                                Off Duty
                                            </span>
                                        )}
                                    </div>

                                    {/* Shifts Column */}
                                    <div className="flex-1 space-y-3">
                                        {dayShifts.length > 0 ? (
                                            dayShifts.map(shift => (
                                                <div
                                                    key={shift.id}
                                                    className={`p-4 rounded-xl border-l-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group ${shift.clockOutTime ? 'border-l-green-500 bg-white' :
                                                            shift.clockedIn ? 'border-l-blue-500 bg-blue-50' :
                                                                'border-l-gray-300 bg-white hover:border-l-[#224fa6] hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${shift.clockedIn ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-[#224fa6]'
                                                            }`}>
                                                            ⏰
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-gray-900">
                                                                    {shift.startTime?.slice(0, 5)} - {shift.endTime?.slice(0, 5)}
                                                                </h4>
                                                                {shift.shiftType && (
                                                                    <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                                                        {shift.shiftType.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-600 mt-0.5">
                                                                {shift.serviceSeeker?.firstName} {shift.serviceSeeker?.lastName}
                                                            </p>
                                                            <div className="text-xs text-gray-400 mt-1 flex gap-2">
                                                                <span>📍 {shift.serviceSeeker?.address ? shift.serviceSeeker.address.split(',')[0] : 'No Address'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="self-end sm:self-center">
                                                        {shift.clockOutTime ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                Completed
                                                            </span>
                                                        ) : shift.clockedIn ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 animate-pulse">
                                                                Active Now
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                                Scheduled
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full min-h-[60px] flex items-center text-gray-300 text-sm italic">
                                                No shifts assigned
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
