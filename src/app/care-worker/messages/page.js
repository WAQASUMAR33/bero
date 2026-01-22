'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchConversations();
        fetchUsers();
    }, []);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const userStr = localStorage.getItem('user');
                const cUser = userStr ? JSON.parse(userStr) : null;
                setUsers(data.filter(u => u.id !== cUser?.id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startConversation = async (userId) => {
        if (isStarting) return;
        setIsStarting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (res.ok && data.conversation) {
                window.location.href = `/care-worker/messages/${data.conversation.id}`;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsStarting(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Messages</h1>
                    <p className="text-slate-500 text-sm mt-1">Connect with your care team</p>
                </div>
                <button
                    onClick={() => setShowNewChatModal(true)}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-[#224fa6] text-white rounded-xl shadow-lg shadow-blue-900/10 hover:bg-[#1b3d82] hover:shadow-blue-900/20 transition-all active:scale-[0.98]"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold">New Chat</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]" />
                        <p className="text-slate-400 text-sm animate-pulse">Loading conversations...</p>
                    </div>
                </div>
            ) : conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-blue-50/50">
                        <svg className="w-10 h-10 text-[#224fa6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No messages yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                        Start a conversation with colleagues, managers, or other care workers to stay connected.
                    </p>
                    <button
                        onClick={() => setShowNewChatModal(true)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        Find someone to chat
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
                    <div className="divide-y divide-slate-50">
                        {conversations.map(conv => {
                            const other = conv.participants?.find(p => p.user.id !== currentUser?.id)?.user;
                            const lastMessage = conv.lastMessage;
                            const unread = conv.unreadCount || 0;

                            return (
                                <Link
                                    key={conv.id}
                                    href={`/care-worker/messages/${conv.id}`}
                                    className={`block p-4 transition-all duration-200 hover:bg-blue-50/50 group ${unread > 0 ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-slate-100`}>
                                                {other?.profilePic ? (
                                                    <Image
                                                        src={other.profilePic}
                                                        alt="User"
                                                        width={56}
                                                        height={56}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${unread > 0 ? 'bg-gradient-to-br from-[#224fa6] to-[#4c7fe6]' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                                        {other?.firstName?.[0]}{other?.lastName?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            {unread > 0 && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white">{unread}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className={`text-base truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {other ? `${other.firstName} ${other.lastName}` : 'Unknown'}
                                                </h3>
                                                {lastMessage && (
                                                    <span className={`text-xs whitespace-nowrap ${unread > 0 ? 'text-[#224fa6] font-medium' : 'text-slate-400'}`}>
                                                        {formatTime(lastMessage.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate pr-8 ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                                                {lastMessage?.senderId === currentUser?.id && <span className="text-slate-400 font-normal">You: </span>}
                                                {lastMessage?.content || 'No messages yet'}
                                            </p>
                                        </div>

                                        <div className="text-slate-300 group-hover:text-[#224fa6] transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* New Chat Modal - Refined */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-in-95 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">New Message</h3>
                                <p className="text-sm text-slate-500">Select a colleague to chat with</p>
                            </div>
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 border-b border-slate-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#224fa6] focus:ring-4 focus:ring-[#224fa6]/10 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => startConversation(user.id)}
                                    disabled={isStarting}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-blue-50/50 rounded-2xl transition-all text-left group border border-transparent hover:border-blue-100"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                                        {user.profilePic ? (
                                            <Image
                                                src={user.profilePic}
                                                alt="User"
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg group-hover:from-[#224fa6] group-hover:to-[#4c7fe6] group-hover:text-white transition-all">
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 group-hover:text-[#224fa6] transition-colors">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide group-hover:text-blue-400 transition-colors">{user.role?.displayName || user.role?.name || 'Staff'}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-blue-200 group-hover:bg-blue-100 group-hover:text-[#224fa6] transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 font-medium">No users found</p>
                                    <p className="text-slate-300 text-sm mt-1">Try searching for a different name</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
