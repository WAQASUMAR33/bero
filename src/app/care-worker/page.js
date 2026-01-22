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
        { title: 'Clock In', icon: '⏰', color: 'bg-indigo-50 text-indigo-600', href: '#' },
        { title: 'My Tasks', icon: '📋', color: 'bg-blue-50 text-blue-600', href: '#' },
        { title: 'Clients', icon: '👥', color: 'bg-sky-50 text-sky-600', href: '#' },
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
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col gap-1 lg:hidden">
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <p className="text-gray-500 text-sm font-medium">{date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Next Shift Card - Using Admin Gradients */}
            <div className="bg-gradient-to-br from-[#224fa6] to-[#3270e9] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-20 rounded-full blur-2xl translate-y-10 -translate-x-10 group-hover:opacity-30 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-white tracking-wide">NEXT SHIFT</span>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold tracking-tight">{nextShift.time}</p>
                            <p className="text-blue-100 text-sm font-medium">{nextShift.date}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-[#224fa6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">Client</p>
                                <p className="font-bold text-lg leading-none mt-0.5">{nextShift.client}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-[#224fa6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">Location</p>
                                <p className="font-semibold text-base leading-tight mt-0.5">{nextShift.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button className="w-full bg-white text-[#224fa6] font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group/btn">
                            View Full Details
                            <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, idx) => (
                        <button key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-4 text-center h-40 group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                {action.icon}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">{action.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications / Updates */}
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
