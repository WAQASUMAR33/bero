'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Chat from './Chat';

export default function Inbox({ isOpen, onClose, currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const inboxRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      fetchUsers();
      // Trigger animation after a tiny delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inboxRef.current && !inboxRef.current.contains(event.target) &&
        backdropRef.current && backdropRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const closeTimeoutRef = useRef(null);

  const handleClose = () => {
    setIsAnimating(false);
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // Wait for animation to complete before calling onClose
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
      closeTimeoutRef.current = null;
    }, 300); // Match the animation duration
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
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
      if (!token) return;

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const filteredUsers = data.filter(user => user.id !== currentUser?.id);
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStartConversation = async (userId) => {
    if (isStartingConversation) return; // Prevent multiple clicks

    try {
      setError(null);
      setIsStartingConversation(true);
      setSelectedUserId(userId);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsStartingConversation(false);
        return;
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        const newConversation = data.conversation;
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setShowNewChatModal(false);
        setSearchQuery('');
        setError(null);
      } else {
        // Handle API errors
        let errorMessage = data.error || 'Failed to start conversation. Please try again.';

        // Provide helpful message for Prisma errors
        if (data.code === 'PRISMA_NOT_GENERATED') {
          errorMessage = 'Database setup required. Please contact your administrator to run database migrations.';
        }

        setError(errorMessage);
        console.error('Error starting conversation:', errorMessage);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsStartingConversation(false);
      setSelectedUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ease-out ${isAnimating ? 'opacity-100 duration-300' : 'opacity-0 duration-300'
          }`}
        onClick={handleClose}
      />

      {/* Inbox Panel with smooth slide */}
      <div
        ref={inboxRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-all ease-out ${isAnimating ? 'translate-x-0 opacity-100 duration-300' : 'translate-x-full opacity-0 duration-300'
          }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {selectedConversation ? (
          <Chat
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={() => {
              setSelectedConversation(null);
              fetchConversations();
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-4 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold">Messages</h2>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(true);
                  setError(null);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="New Chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-center">No conversations yet</p>
                  <p className="text-sm text-center mt-2">Start a new chat to begin messaging</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants?.find(
                      p => p.user.id !== currentUser?.id
                    );
                    const lastMessage = conversation.lastMessage;
                    const unreadCount = conversation.unreadCount || 0;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {otherParticipant?.user?.profilePic ? (
                              <Image
                                src={otherParticipant.user.profilePic}
                                alt="Profile"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold">
                                {otherParticipant?.user?.firstName?.[0] || 'U'}
                                {otherParticipant?.user?.lastName?.[0] || ''}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {otherParticipant?.user
                                  ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
                                  : 'Unknown User'}
                              </h3>
                              {lastMessage && (
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {formatTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {lastMessage && (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 truncate">
                                  {lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                                  {lastMessage.content}
                                </p>
                                {unreadCount > 0 && (
                                  <span className="ml-2 bg-[#224fa6] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
                    <button
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSearchQuery('');
                        setError(null);
                        setIsStartingConversation(false);
                        setSelectedUserId(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Users List */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No users found</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredUsers.map((user) => {
                          const isSelected = selectedUserId === user.id;
                          const isProcessing = isStartingConversation && isSelected;

                          return (
                            <button
                              key={user.id}
                              onClick={() => handleStartConversation(user.id)}
                              disabled={isStartingConversation}
                              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left ${isProcessing
                                  ? 'bg-blue-50 cursor-wait'
                                  : isSelected
                                    ? 'bg-blue-100'
                                    : 'hover:bg-gray-50'
                                } ${isStartingConversation && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${isProcessing ? 'animate-pulse' : ''
                                }`}>
                                {user.profilePic ? (
                                  <Image
                                    src={user.profilePic}
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold">
                                    {isProcessing ? (
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        {user.firstName?.[0] || 'U'}
                                        {user.lastName?.[0] || ''}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              </div>
                              {isProcessing && (
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

