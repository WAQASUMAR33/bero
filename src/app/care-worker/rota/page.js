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

    // Action State
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    // Modal State
    const [showClockInModal, setShowClockInModal] = useState(false);
    const [selectedShiftForClockIn, setSelectedShiftForClockIn] = useState(null);

    // Clock In Location State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);

    // Clock Out Modal State
    const [showClockOutModal, setShowClockOutModal] = useState(false);
    const [selectedShiftForClockOut, setSelectedShiftForClockOut] = useState(null);
    const [isEarlyExit, setIsEarlyExit] = useState(false);

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

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(`${position.coords.latitude}, ${position.coords.longitude}`);
                },
                (err) => {
                    reject(err);
                }
            );
        });
    };

    const getShiftSchedule = (shift) => {
        if (!shift) return "--:--";
        if (shift.startTime && shift.endTime) {
            return `${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)}`;
        }
        return "Not Specified";
    };

    const initiateClockIn = async (shift) => {
        if (!shift) return;
        // Optional: Prevent clocking in if not today?
        // For now, let's allow it but maybe the API restricts it.

        setSelectedShiftForClockIn(shift);
        setShowClockInModal(true);

        // Reset location state
        setCurrentLocation(null);
        setLocationError(null);
        setIsFetchingLocation(true);

        try {
            const loc = await getCurrentLocation();
            setCurrentLocation(loc);
        } catch (err) {
            console.error("Location fetch failed", err);
            setLocationError("Could not fetch location. Please ensure GPS is enabled.");
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const confirmClockIn = async () => {
        if (!selectedShiftForClockIn || actionLoading) return;
        setActionLoading(true);
        setActionError(null);

        let location = currentLocation;
        if (!location) {
            try {
                location = await getCurrentLocation();
            } catch (locErr) {
                // ignore
            }
        }
        if (!location) location = "Unknown";

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/clock-in-out/clock-in', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shiftAssignmentId: selectedShiftForClockIn.shiftAssignmentId,
                    location,
                    workType: 'REGULAR',
                    notes: 'Clocked in via Rota Page'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setShowClockInModal(false);
                setSelectedShiftForClockIn(null);
                await fetchShifts(); // Refresh list
            } else {
                setActionError(data.error || 'Failed to clock in');
                if (!data.success) setShowClockInModal(false);
            }
        } catch (err) {
            setActionError('Network error during clock in');
            setShowClockInModal(false);
        } finally {
            setActionLoading(false);
        }
    };

    const initiateClockOut = (shift) => {
        if (!shift) return;
        setSelectedShiftForClockOut(shift);

        const now = new Date();
        // Construct end date from shift info if possible.
        // shift.endTime is HH:mm:ss. shift.fromDate/assignmentDate is the date.
        let expectedEnd = null;
        if (shift.endTime) {
            const dateStr = shift.assignmentDate
                ? shift.assignmentDate.split('T')[0]
                : shift.fromDate.split('T')[0];
            expectedEnd = new Date(`${dateStr}T${shift.endTime}`);
        }

        const isEarly = expectedEnd && now < expectedEnd;
        setIsEarlyExit(isEarly);
        setShowClockOutModal(true);
    };

    const handleClockOut = async () => {
        if (actionLoading || !selectedShiftForClockOut) return;
        setActionLoading(true);
        setActionError(null);

        try {
            const token = localStorage.getItem('token');
            let location = "Unknown";
            try {
                location = await getCurrentLocation();
            } catch (e) { }

            const response = await fetch('/api/clock-in-out/clock-out', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clockInOutId: selectedShiftForClockOut.clockInOutId,
                    location,
                    notes: 'Clocked out via Rota Page'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                await fetchShifts();
                setShowClockOutModal(false);
                setSelectedShiftForClockOut(null);
                setIsEarlyExit(false);
            } else {
                setActionError(data.error || 'Failed to clock out');
                setShowClockOutModal(false);
            }
        } catch (err) {
            setActionError('Network error during clock out');
            setShowClockOutModal(false);
        } finally {
            setActionLoading(false);
        }
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



                                                    {/* Actions / Status Badge */}
                                                    <div className="self-end sm:self-center flex flex-col items-end gap-2">
                                                        {
                                                            shift.clockOutTime ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                    Completed
                                                                </span>
                                                            ) : shift.clockedIn ? (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 animate-pulse">
                                                                        Active Now
                                                                    </span>
                                                                    <button
                                                                        onClick={() => initiateClockOut(shift)}
                                                                        className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                                                                    >
                                                                        Clock Out
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                                        Scheduled
                                                                    </span>
                                                                    {isToday && (
                                                                        <button
                                                                            onClick={() => initiateClockIn(shift)}
                                                                            className="text-xs bg-[#224fa6] text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            Start Shift
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        }
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

            {/* Error Overlay for Actions */}
            {
                actionError && (
                    <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{actionError}</span>
                        <button onClick={() => setActionError(null)} className="ml-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )
            }

            {/* Clock In Modal */}
            {
                showClockInModal && selectedShiftForClockIn && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 scale-in-95 animate-in zoom-in-95">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#224fa6]">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Start Shift?</h3>
                                <p className="text-slate-500 text-sm mt-1">Please confirm shift details below</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Service User</span>
                                    <span className="font-bold text-slate-700">
                                        {selectedShiftForClockIn.serviceSeeker?.firstName} {selectedShiftForClockIn.serviceSeeker?.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Schedule</span>
                                    <span className="font-bold text-slate-700">
                                        {getShiftSchedule(selectedShiftForClockIn)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Location</span>
                                    <div className="text-right">
                                        {isFetchingLocation ? (
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <span className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></span>
                                                <span className="text-xs">Fetching...</span>
                                            </div>
                                        ) : locationError ? (
                                            <span className="text-red-500 text-xs text-right max-w-[150px] block leading-tight">{locationError}</span>
                                        ) : (
                                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Captured
                                            </span>
                                        )}
                                        {currentLocation && (
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[140px] truncate">{currentLocation}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowClockInModal(false)}
                                    className="py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmClockIn}
                                    disabled={actionLoading}
                                    className="py-3 px-4 rounded-xl bg-[#224fa6] font-bold text-white hover:bg-[#1e438f] shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {actionLoading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Clock In
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Clock Out Modal */}
            {
                showClockOutModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 scale-in-95 animate-in zoom-in-95 border-t-4 border-red-500">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {isEarlyExit ? 'Leaving Early?' : 'Clock Out?'}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-[260px] mx-auto">
                                    {isEarlyExit
                                        ? 'It looks like your shift hasn\'t finished yet. Are you sure you want to clock out early?'
                                        : 'Confirm you want to end your shift now.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowClockOutModal(false)}
                                    className="py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClockOut}
                                    disabled={actionLoading}
                                    className="py-3 px-4 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isEarlyExit ? 'Yes, Clock Out' : 'Clock Out'}
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
