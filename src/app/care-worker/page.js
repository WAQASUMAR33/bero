'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CareWorkerDashboard() {
    const [user, setUser] = useState(null);
    const [date, setDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [nextUpcomingShift, setNextUpcomingShift] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const timer = setInterval(() => setDate(new Date()), 60000);

        // Initial fetch
        fetchShifts();

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

                    // Find active shift (clocked in but not out)
                    const active = fetchedShifts.find(s => s.clockedIn && !s.clockOutTime);
                    setActiveShift(active);

                    // Find next upcoming shift (not started, or started but not clocked in)
                    // We sort by startTime
                    const upcoming = fetchedShifts
                        .filter(s => !s.clockedIn && !s.clockOutTime) // Not processed yet
                        .sort((a, b) => new Date(a.expectedStart) - new Date(b.expectedStart))[0];

                    setNextUpcomingShift(upcoming);
                }
            }
        } catch (err) {
            console.error('Failed to fetch shifts', err);
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

    const handleClockIn = async (shiftAssignmentId) => {
        if (loading) return;
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            let location = "Unknown";
            try {
                location = await getCurrentLocation();
            } catch (locErr) {
                console.warn("Location fetch failed, proceeding with fallback", locErr);
                // We proceed even if location fails, API might accept it or we send a placeholder if required
                // API docs say location is optional but "captured for attendance tracking".
                // We'll send what we have or empty string.
            }

            const response = await fetch('/api/clock-in-out/clock-in', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shiftAssignmentId,
                    location,
                    workType: 'REGULAR',
                    notes: 'Clocked in via Web Dashboard'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                // Refresh state
                await fetchShifts();
            } else {
                setError(data.error || 'Failed to clock in');
            }
        } catch (err) {
            setError('Network error during clock in');
        } finally {
            setLoading(false);
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
            } else {
                setError(data.error || 'Failed to clock out');
            }
        } catch (err) {
            setError('Network error during clock out');
        } finally {
            setLoading(false);
        }
    };

    // Determine what to show in the main card
    const mainCardData = activeShift || nextUpcomingShift || {
        // Fallback demo data if no shifts from API (or show empty state)
        client: "No upcoming shifts",
        time: "--:--",
        date: "Today",
        location: "Relax and recharge!",
        tasks: 0,
        isFallback: true
    };

    const formatTimeRange = (start, end) => {
        if (!start || !end) return "--:--";
        const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${s} - ${e}`;
    };

    const clientName = mainCardData.serviceSeeker
        ? `${mainCardData.serviceSeeker.firstName} ${mainCardData.serviceSeeker.lastName}`
        : mainCardData.client; // fallback

    const shiftTime = mainCardData.expectedStart
        ? formatTimeRange(mainCardData.expectedStart, mainCardData.expectedEnd)
        : mainCardData.time; // fallback

    // Quick Actions - Dynamic Clock In/Out button
    const quickActions = [
        {
            title: activeShift ? 'Clock Out' : 'Clock In',
            icon: '⏰',
            color: activeShift ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600',
            action: () => {
                if (activeShift) {
                    handleClockOut(activeShift.clockInOutId);
                } else if (nextUpcomingShift) {
                    handleClockIn(nextUpcomingShift.shiftAssignmentId);
                } else {
                    // No shift to clock in to
                    alert("No scheduled shift found to clock in.");
                }
            }
        },
        { title: 'My Tasks', icon: '📋', color: 'bg-blue-50 text-blue-600', href: '#' },
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
                                    onClick={() => handleClockOut(activeShift.clockInOutId)}
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
                                    onClick={() => handleClockIn(nextUpcomingShift.shiftAssignmentId)}
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

            {/* Recent notifications (Static for now) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Recent Updates</h3>
                    <button className="text-[#224fa6] text-sm font-semibold hover:text-blue-700">View All</button>
                </div>
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0 relative group">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-2 shrink-0 ring-4 ring-red-50" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-bold text-gray-800 group-hover:text-[#224fa6] transition-colors">Care Plan Updated</p>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">2h ago</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">New medication instructions added for Sarah Jenkins. Please review before next visit.</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
