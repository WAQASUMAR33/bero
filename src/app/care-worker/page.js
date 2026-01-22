'use client';

import { useState, useEffect } from 'react';

export default function CareWorkerDashboard() {
    const [user, setUser] = useState(null);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const timer = setInterval(() => setDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const quickActions = [
        { title: 'Clock In', icon: '⏰', color: 'bg-blue-50 text-blue-600', href: '#' },
        { title: 'My Tasks', icon: '📋', color: 'bg-emerald-50 text-emerald-600', href: '#' },
        { title: 'Clients', icon: '👥', color: 'bg-purple-50 text-purple-600', href: '#' },
        { title: 'Report', icon: '⚠️', color: 'bg-amber-50 text-amber-600', href: '#' },
    ];

    const nextShift = {
        client: "Sarah Jenkins",
        time: "09:00 - 14:00",
        date: "Today",
        location: "12 Maple Drive",
        tasks: 4
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                <p className="text-slate-500 text-sm">{date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Next Shift Card - Prominent */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-10 translate-x-10" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Next Shift</span>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{nextShift.time}</p>
                            <p className="text-white/80 text-sm">{nextShift.date}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-white/70">Client</p>
                                <p className="font-semibold text-lg leading-tight">{nextShift.client}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-white/70">Location</p>
                                <p className="font-medium leading-tight">{nextShift.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button className="w-full bg-white text-teal-700 font-bold py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors active:scale-[0.98]">
                            View Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, idx) => (
                        <button key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-3 text-center h-32">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${action.color}`}>
                                {action.icon}
                            </div>
                            <span className="font-semibold text-slate-700 text-sm">{action.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications / Updates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Updates</h3>
                    <button className="text-teal-600 text-sm font-medium">View All</button>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                            <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Care Plan Updated</p>
                                <p className="text-xs text-slate-500 mt-1">New medication instructions added for Sarah Jenkins.</p>
                                <p className="text-xs text-slate-400 mt-2">2 hours ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
