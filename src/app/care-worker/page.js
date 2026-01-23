'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CareWorkerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [date, setDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [nextUpcomingShift, setNextUpcomingShift] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [showClockInModal, setShowClockInModal] = useState(false);
    const [selectedShiftForClockIn, setSelectedShiftForClockIn] = useState(null);

    // Clock In Location State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);

    // Clock Out Modal State
    const [showClockOutModal, setShowClockOutModal] = useState(false);
    const [isEarlyExit, setIsEarlyExit] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const timer = setInterval(() => setDate(new Date()), 60000);

        // Initial fetch
        fetchShifts();
        fetchAttendanceHistory();

        return () => clearInterval(timer);
    }, []);

    const fetchShifts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/clock-in-out/my-shifts?date=${today}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const fetchedShifts = data.data || [];
                    setShifts(fetchedShifts);

                    const active = fetchedShifts.find(s => s.clockedIn && !s.clockOutTime);
                    setActiveShift(active);

                    const upcoming = fetchedShifts
                        .filter(s => !s.clockedIn && !s.clockOutTime)
                        .sort((a, b) => new Date(a.expectedStart) - new Date(b.expectedStart))[0];

                    setNextUpcomingShift(upcoming);
                }
            }
        } catch (err) {
            console.error('Failed to fetch shifts', err);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            setLoadingHistory(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/clock-in-out?view=my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const history = (data.data || [])
                        .sort((a, b) => new Date(b.clockInTime) - new Date(a.clockInTime))
                        .slice(0, 5);
                    setAttendanceHistory(history);
                }
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoadingHistory(false);
        }
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

    const initiateClockIn = async (shift) => {
        if (!shift) return;
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
        if (!selectedShiftForClockIn || loading) return;
        setLoading(true);
        setError(null);

        // Use location if already fetched, or try fetching again if failed/missing
        let location = currentLocation;

        if (!location) {
            try {
                location = await getCurrentLocation();
            } catch (locErr) {
                // proceed with "Unknown" or handle error? User said "show details ... location that it fetch auto"
                // We will proceed but logged
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
                    notes: 'Clocked in via Web Dashboard'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setShowClockInModal(false);
                setSelectedShiftForClockIn(null);
                await fetchShifts();
                await fetchAttendanceHistory();
            } else {
                setError(data.error || 'Failed to clock in');
                if (!data.success) setShowClockInModal(false);
            }
        } catch (err) {
            setError('Network error during clock in');
            setShowClockInModal(false);
        } finally {
            setLoading(false);
        }
    };

    const initiateClockOut = (shift) => {
        if (!shift) return;

        // Check for early exit
        const now = new Date();
        const expectedEnd = new Date(shift.expectedEnd);

        // We consider it early if current time is strictly before expected end time
        const isEarly = now < expectedEnd;

        if (isEarly) {
            setIsEarlyExit(true);
            setShowClockOutModal(true);
        } else {
            // Not early, straightforward clock out
            handleClockOut(shift.clockInOutId);
        }
    };

    const handleClockOut = async (clockInOutId) => {
        if (loading) return;
        setLoading(true);
        setError(null);

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
                    clockInOutId,
                    location,
                    notes: 'Clocked out via Web Dashboard'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                await fetchShifts();
                await fetchAttendanceHistory();
                setShowClockOutModal(false); // Make sure to close modal if it was open
                setIsEarlyExit(false);
            } else {
                setError(data.error || 'Failed to clock out');
                setShowClockOutModal(false);
            }
        } catch (err) {
            setError('Network error during clock out');
            setShowClockOutModal(false);
        } finally {
            setLoading(false);
        }
    };

    // Determine what to show in the main card
    const mainCardData = activeShift || nextUpcomingShift || {
        client: "No upcoming shifts",
        time: "--:--",
        date: "Today",
        location: "Relax and recharge!",
        tasks: 0,
        isFallback: true
    };

    const formatTimeRange = (start, end) => {
        if (start && end) {
            const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${s} - ${e}`;
        }
        // Fallback for missing timestamps
        return "--:--";
    };

    // Robust fallback for schedule display
    const getShiftSchedule = (shift) => {
        if (!shift) return "--:--";
        // Attempt 1: expectedStart/End
        if (shift.expectedStart && shift.expectedEnd) {
            return formatTimeRange(shift.expectedStart, shift.expectedEnd);
        }
        // Attempt 2: startTime/endTime
        if (shift.startTime && shift.endTime) {
            // These might be HH:MM strings, not timestamps
            return `${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)}`;
        }
        return "Not Specified";
    };

    const clientName = mainCardData.serviceSeeker
        ? `${mainCardData.serviceSeeker.firstName} ${mainCardData.serviceSeeker.lastName}`
        : mainCardData.client;

    const shiftTime = getShiftSchedule(mainCardData);

    const quickActions = [
        {
            title: activeShift ? 'Clock Out' : 'Clock In',
            icon: '⏰',
            color: activeShift ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600',
            action: () => {
                if (activeShift) {
                    initiateClockOut(activeShift);
                } else if (nextUpcomingShift) {
                    initiateClockIn(nextUpcomingShift);
                } else {
                    alert("No scheduled shift found to clock in.");
                }
            }
        },
        { title: 'My Rota', icon: '📅', color: 'bg-indigo-50 text-indigo-600', action: () => router.push('/care-worker/rota') },
        { title: 'Holidays', icon: '✈️', color: 'bg-emerald-50 text-emerald-600', action: () => router.push('/care-worker/holidays') },
        { title: 'PPE Stock', icon: '📦', color: 'bg-orange-50 text-orange-600', action: () => router.push('/care-worker/ppe-stock') },
        { title: 'Clients', icon: '👥', color: 'bg-sky-50 text-sky-600', href: '#' },
        { title: 'Report', icon: '⚠️', color: 'bg-amber-50 text-amber-600', href: '#' },
    ];

    if (!user) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col gap-1 lg:hidden">
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <p className="text-gray-500 text-sm font-medium">{date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Next/Active Shift Card */}
            <div className={`rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group transition-all duration-500 ${activeShift
                ? 'bg-gradient-to-br from-green-600 to-emerald-600 shadow-green-900/20'
                : 'bg-gradient-to-br from-[#224fa6] to-[#3270e9] shadow-blue-900/10'
                }`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl translate-y-10 -translate-x-10 group-hover:opacity-20 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`backdrop-blur-md border px-3 py-1 rounded-full text-xs font-semibold text-white tracking-wide ${activeShift ? 'bg-green-500/20 border-green-400/30' : 'bg-white/10 border-white/20'
                                }`}>
                                {activeShift ? 'CURRENTLY ACTIVE' : 'NEXT SHIFT'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold tracking-tight">{shiftTime}</p>
                            <p className="text-blue-100 text-sm font-medium">
                                {activeShift ? 'Started at ' + new Date(activeShift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg text-[#224fa6]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Client</p>
                                <p className="font-bold text-lg leading-none mt-0.5">{clientName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg text-[#224fa6]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Type</p>
                                <p className="font-semibold text-base leading-tight mt-0.5">
                                    {mainCardData.workType || 'Standard Care'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!mainCardData.isFallback && (
                        <div className="mt-8">
                            {activeShift ? (
                                <button
                                    onClick={() => initiateClockOut(activeShift)}
                                    disabled={loading}
                                    className="w-full bg-white text-red-600 font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-red-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group/btn disabled:opacity-70"
                                >
                                    {loading ? 'Processing...' : 'Clock Out Now'}
                                    {!loading && (
                                        <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => initiateClockIn(nextUpcomingShift)}
                                    disabled={loading}
                                    className="w-full bg-white text-[#224fa6] font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group/btn disabled:opacity-70"
                                >
                                    {loading ? 'Processing...' : 'Clock In to Start Shift'}
                                    {!loading && (
                                        <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={action.action} // if action defined
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-4 text-center h-40 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                {action.icon}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">{action.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Attendance History */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Recent Attendance</h3>
                    {attendanceHistory.length > 5 && (
                        <Link href="/care-worker/attendance" className="text-[#224fa6] text-sm font-semibold hover:text-blue-700">View All</Link>
                    )}
                </div>
                {loadingHistory ? (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-200" />
                    </div>
                ) : attendanceHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p>No recent attendance records found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {attendanceHistory.map((record) => (
                            <div key={record.id} className="flex gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0 items-center">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${record.clockOutTime ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {new Date(record.clockInTime).getDate()}
                                    <span className="text-[10px] font-normal ml-0.5">
                                        {new Date(record.clockInTime).toLocaleDateString([], { month: 'short' })}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 truncate">
                                            {record.serviceSeeker?.firstName} {record.serviceSeeker?.lastName}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${record.clockOutTime ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {record.clockOutTime ? 'Completed' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(record.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {record.clockOutTime && ` - ${new Date(record.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        </span>
                                        {record.isLate && (
                                            <span className="text-red-500 font-medium bg-red-50 px-1 rounded">• Late</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Clock In Confirmation Modal */}
            {showClockInModal && selectedShiftForClockIn && (
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
                            {selectedShiftForClockIn.notes && (
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Notes</span>
                                    <p className="text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                                        {selectedShiftForClockIn.notes || "No special notes for this shift."}
                                    </p>
                                </div>
                            )}
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
                                disabled={loading || isFetchingLocation && !currentLocation} // Wait for location if preferred, or allow submit if desired (current logic allows, but better to wait or just show loading)
                                className="py-3 px-4 rounded-xl bg-[#224fa6] font-bold text-white hover:bg-[#1e438f] shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
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
            )}

            {/* Clock Out / Early Exit Modal */}
            {showClockOutModal && (
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
                                onClick={() => handleClockOut(activeShift?.clockInOutId)}
                                disabled={loading}
                                className="py-3 px-4 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
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
            )}
        </div>
    );
}
