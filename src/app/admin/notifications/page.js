'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    const [view, setView] = useState('active'); // 'active' or 'recycled'

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchNotifications(true);
        }
    }, [user, view]);

    const fetchNotifications = async (reset = false) => {
        try {
            if (reset) setIsLoading(true);
            const token = localStorage.getItem('token');
            const currentPage = reset ? 1 : page;

            const res = await fetch(`/api/notifications?limit=20&page=${currentPage}&view=${view}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                if (reset) {
                    setNotifications(data.data);
                } else {
                    setNotifications(prev => [...prev, ...data.data]);
                }
                setHasMore(data.pagination.page < data.pagination.pages);
                if (!reset) setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setPage(nextPage);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications?limit=20&page=${nextPage}&view=${view}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(prev => [...prev, ...data.data]);
                setHasMore(data.pagination.page < data.pagination.pages);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async (id) => {
        if (view === 'recycled') return; // Cannot modify in bin? Or should allow? usually meaningless in bin.
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isRead: true })
            });

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/notifications`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh list (which should be empty now)
                fetchNotifications(true);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-x-hidden w-full max-w-full">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col lg:ml-64 min-w-0 max-w-full overflow-x-hidden">
                <Header user={user} />
                <main className="flex-1 p-6 overflow-y-auto w-full max-w-5xl mx-auto">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-500">View all your updates and alerts.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
                                <button
                                    onClick={() => setView('active')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'active'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Inbox
                                </button>
                                <button
                                    onClick={() => setView('recycled')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'recycled'
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Recycle Bin
                                </button>
                            </div>

                            {view === 'active' && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to clear all notifications? They will be moved to the recycle bin.')) {
                                            clearAllNotifications();
                                        }
                                    }}
                                    className="px-4 py-2.5 bg-white border border-gray-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-100 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                {view === 'active' ? 'No new notifications.' : 'Recycle bin is empty.'}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-4 ${view === 'active' && !n.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => view === 'active' && !n.isRead && markAsRead(n.id)}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${view === 'active' && !n.isRead ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`text-sm font-medium ${view === 'active' && !n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {n.title}
                                                </h3>
                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                                            {n.link && (
                                                <a href={n.link} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                                    View Details
                                                </a>
                                            )}
                                            {view === 'recycled' && n.deletedAt && (
                                                <p className="text-xs text-red-400 mt-2">
                                                    Deleted: {new Date(n.deletedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        className="w-full py-3 text-sm text-blue-600 font-medium hover:bg-gray-50 transition-colors text-center"
                                    >
                                        Load More
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
