'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

export default function ChatPage() {
    const params = useParams();
    const conversationId = params.id;
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));

        fetchConversationDetails();
        fetchMessages();

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchMessages(true);
        }, 15000);

        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversationDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const conv = data.conversations.find(c => c.id === parseInt(conversationId));
                if (conv) setConversation(conv);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    if (data.messages.length !== prev.length) return data.messages;
                    if (prev.length > 0 && data.messages.length > 0 && data.messages[data.messages.length - 1].id !== prev[prev.length - 1].id) return data.messages;
                    return prev;
                });
                if (!silent) setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;
        setIsSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newMessage })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const otherUser = conversation?.participants?.find(p => p.user.id !== currentUser?.id)?.user;

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-slate-50 -m-4 lg:-m-8 relative">
            {/* Premium Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-4 py-3 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors group">
                    <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                {otherUser ? (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden shadow-md ring-2 ring-white">
                                {otherUser.profilePic ? (
                                    <Image
                                        src={otherUser.profilePic}
                                        alt="User"
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#224fa6] to-[#4c7fe6] flex items-center justify-center text-white font-bold text-sm">
                                        {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 leading-tight">{otherUser.firstName} {otherUser.lastName}</h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {otherUser.role?.displayName || 'Care Worker'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area - with nice background pattern or color */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <div className="w-24 h-24 bg-slate-200/50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    // Render Grouped Messages
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date} className="space-y-4">
                            <div className="flex justify-center sticky top-2 z-10">
                                <span className="bg-slate-200/80 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    {date}
                                </span>
                            </div>
                            {msgs.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser?.id;
                                const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1].senderId !== msg.senderId;
                                const isFirstInGroup = idx === 0 || msgs[idx - 1].senderId !== msg.senderId;

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`flex max-w-[85%] lg:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>

                                            {/* Avatar for Other Person */}
                                            {!isMe && (
                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-slate-100 shadow-sm ${isLastInGroup ? 'opacity-100' : 'opacity-0'}`}>
                                                    {otherUser?.profilePic ? (
                                                        <Image
                                                            src={otherUser.profilePic}
                                                            alt="User"
                                                            width={32}
                                                            height={32}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-white flex items-center justify-center text-[#224fa6] text-xs font-bold">
                                                            {otherUser?.firstName?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <div className={`
                                            px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative
                                            ${isMe
                                                        ? 'bg-gradient-to-br from-[#224fa6] to-[#3270e9] text-white rounded-2xl rounded-tr-sm'
                                                        : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                                                    }
                                            ${!isLastInGroup && isMe ? 'rounded-br-2xl mb-1' : ''}
                                            ${!isLastInGroup && !isMe ? 'rounded-bl-2xl mb-1' : ''}
                                        `}>
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </div>

                                                {/* Timestamp - visible on hover or if last in group */}
                                                <div className={`text-[10px] text-slate-400 mt-1 px-1 transition-opacity ${isMe ? 'text-right' : 'text-left'} ${isLastInGroup ? 'opacity-100' : 'opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <span className="ml-1 font-bold">✓</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 lg:p-5 sticky bottom-0 z-20">
                <form onSubmit={sendMessage} className="flex gap-3 items-end max-w-4xl mx-auto">
                    <button type="button" className="p-3 text-slate-400 hover:text-[#224fa6] hover:bg-blue-50 rounded-full transition-colors flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:bg-white focus-within:border-[#224fa6] focus-within:ring-4 focus-within:ring-[#224fa6]/10 transition-all flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 outline-none placeholder:text-slate-400 text-slate-800"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="p-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex-shrink-0"
                    >
                        {isSending ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-6 h-6 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
