'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import PushNotificationToggle from '@/components/PushNotificationToggle';

export default function CareWorkerLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // OPTIMIZED: Fetch notifications with proper cleanup
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/notifications?limit=5', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                    setUnreadCount(data.unreadCount);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Re-fetch to be sure
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const clearAllNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            setNotifications([]);
            setUnreadCount(0);
            await fetch(`/api/notifications`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            router.push('/care-worker-login');
            return;
        }

        setUser(JSON.parse(storedUser));
    }, [router]);

    // OPTIMIZED: Notification polling with rate limiting and notification check
    useEffect(() => {
        if (!user?.id) return;

        let isMounted = true;
        let lastCheckTime = 0;
        const CHECK_COOLDOWN = 60000; // 1 minute between notification checks

        // Trigger system notification check (shifts, visits, policies)
        const triggerNotificationCheck = async () => {
            const now = Date.now();
            if (now - lastCheckTime < CHECK_COOLDOWN) return;
            lastCheckTime = now;

            try {
                const token = localStorage.getItem('token');
                if (!token || !isMounted) return;

                await fetch('/api/notifications/check', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Refresh notifications after check
                if (isMounted) fetchNotifications();
            } catch (e) {
                console.error('Notification check error:', e);
            }
        };

        // Initial fetch
        fetchNotifications();

        // Delayed initial notification check (5s after load)
        const initialCheck = setTimeout(() => {
            if (isMounted) triggerNotificationCheck();
        }, 5000);

        // Poll every 45 seconds (optimized from 30s)
        const notifInterval = setInterval(() => {
            if (isMounted) fetchNotifications();
        }, 45000);

        // Run notification check every 2 minutes
        const checkInterval = setInterval(() => {
            if (isMounted) triggerNotificationCheck();
        }, 120000);

        return () => {
            isMounted = false;
            clearTimeout(initialCheck);
            clearInterval(notifInterval);
            clearInterval(checkInterval);
        };
    }, [user?.id]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/care-worker-login');
    };

    const navItems = [
        {
            name: 'Dashboard', href: '/care-worker', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: 'Rota', href: '/care-worker/rota', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: 'Care Plan', href: '/care-worker/care-plan', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            name: 'Visits', href: '/care-worker/visits', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: 'Policies', href: '/care-worker/policies', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            name: 'Profile', href: '/care-worker/profile', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            name: 'Messages', href: '/care-worker/messages', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        },
        {
            name: 'Training', href: '/care-worker/training', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            )
        },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row pb-20 lg:pb-0">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 fixed top-0 bottom-0 left-0 z-20">
                <div className="p-6 flex items-center justify-center border-b border-gray-200">
                    <Image src="/assets/logo2.png" width={120} height={60} alt="Logo" className="object-contain" />
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-blue-50 text-[#224fa6] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                <div className={`transition-colors ${isActive ? 'text-[#224fa6]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    {item.icon}
                                </div>
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Profile in Sidebar */}
                <div className="p-4 border-t border-gray-200">
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="w-full flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors text-left"
                        >
                            <div className="w-10 h-10 bg-[#224fa6] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 overflow-hidden relative">
                                {user.profilePic ? (
                                    <Image
                                        src={user.profilePic}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-gray-500 truncate">Care Worker</p>
                            </div>
                        </button>
                        {showProfileDropdown && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area Wrapper */}
            <div className="flex-1 flex flex-col lg:ml-64 w-full">

                {/* HEADER - Visible on Desktop & Mobile */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#224fa6] font-bold text-xs ring-2 ring-white shadow-sm overflow-hidden relative">
                            {user.profilePic ? (
                                <Image
                                    src={user.profilePic}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">Hi, {user.firstName}</h1>
                            <p className="text-[10px] text-gray-500 font-medium">Ready to care?</p>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Push Notification Toggle */}
                        <PushNotificationToggle />

                        {/* Notification Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-gray-400 hover:text-[#224fa6] transition-colors relative group rounded-lg hover:bg-gray-50 focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                                )}
                            </button>

                            {/* Notifications Panel */}
                            {showNotifications && (
                                <div className="fixed top-[4.5rem] left-4 right-4 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-3 lg:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 mx-auto max-w-sm lg:max-w-none">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800">Notifications</h3>
                                            {unreadCount > 0 && <span className="bg-[#224fa6] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={fetchNotifications} className="text-gray-400 hover:text-[#224fa6] transition-colors" title="Refresh">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                            {notifications.length > 0 && (
                                                <button onClick={clearAllNotifications} className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors">
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-[60vh] lg:max-h-[28rem] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-medium text-sm">No new notifications</p>
                                                <p className="text-gray-400 text-xs mt-1">We'll let you know when something important happens.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.map((notif) => {
                                                    let iconColor = 'text-blue-500 bg-blue-50';
                                                    let borderColor = 'border-l-blue-500';
                                                    if (notif.type === 'SUCCESS') { iconColor = 'text-emerald-500 bg-emerald-50'; borderColor = 'border-l-emerald-500'; }
                                                    if (notif.type === 'WARNING') { iconColor = 'text-amber-500 bg-amber-50'; borderColor = 'border-l-amber-500'; }
                                                    if (notif.type === 'ERROR') { iconColor = 'text-red-500 bg-red-50'; borderColor = 'border-l-red-500'; }

                                                    return (
                                                        <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-all group relative border-l-4 ${borderColor} ${!notif.isRead ? 'bg-blue-50/10' : ''}`}>
                                                            <div className="flex gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${iconColor}`}>
                                                                    {notif.type === 'SUCCESS' ? (
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                    ) : notif.type === 'ERROR' ? (
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-6">
                                                                    <p className="text-sm font-bold text-gray-800 leading-snug">{notif.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                                        {new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => deleteNotification(notif.id, e)}
                                                                className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                                                title="Remove"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-100 p-2 bg-gray-50/50 text-center">
                                        <Link href="/care-worker/notifications" className="text-xs font-semibold text-[#224fa6] hover:text-blue-800 py-1 block">
                                            View All Notifications
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Logout (Small icon) */}
                        <button onClick={handleLogout} className="lg:hidden p-2 text-gray-400 hover:text-red-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center px-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href} className={`flex-1 flex flex-col items-center justify-center py-3 px-1 transition-colors ${isActive ? 'text-[#224fa6]' : 'text-gray-400 hover:text-gray-600'}`}>
                                <div className={isActive ? 'transform scale-110 transition-transform' : ''}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] mt-1 font-medium truncate w-full text-center">{item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
}
