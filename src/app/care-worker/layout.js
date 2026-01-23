'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CareWorkerLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
                            <div className="w-10 h-10 bg-[#224fa6] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {user.firstName?.[0]}{user.lastName?.[0]}
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#224fa6] font-bold text-xs ring-2 ring-white shadow-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
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
                        {/* Notification Icon (Copied style from Admin) */}
                        <button className="p-2 text-gray-400 hover:text-[#224fa6] transition-colors relative group rounded-lg hover:bg-gray-50">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>

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
