'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Inbox from './Inbox';
import EmergencyAlert from './EmergencyAlert';

export default function Header({ user }) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Check if user can view emergencies (ADMIN, DIRECTOR, HR, REGISTER_MANAGER)
  const canViewEmergencies = user?.role?.name &&
    ['ADMIN', 'DIRECTOR', 'HR', 'REGISTER_MANAGER'].includes(user.role.name);

  // Poll for emergency alerts
  useEffect(() => {
    if (!canViewEmergencies) return;

    const fetchEmergencyCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/emergency?status=ACTIVE', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setEmergencyCount(data.activeCount || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching emergency count:', error);
      }
    };

    // Initial fetch
    fetchEmergencyCount();

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(fetchEmergencyCount, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [canViewEmergencies]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/notifications?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-30">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search type of keywords"
              className="pl-4 pr-12 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:border-transparent w-64"
            />
            <button className="absolute right-0 top-0 h-full px-3 bg-white border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Emergency Alert Button */}
            {canViewEmergencies && (
              <button
                onClick={() => setShowEmergencyAlert(true)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors relative group"
                title="Emergency Alerts"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {emergencyCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {emergencyCount > 9 ? '9+' : emergencyCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications */}
            <div
              className="relative"
              onMouseEnter={() => setShowNotificationsDropdown(true)}
              onMouseLeave={() => setShowNotificationsDropdown(false)}
            >
              <button
                onClick={() => router.push('/admin/notifications')}
                className="p-2 text-gray-400 hover:text-[#224fa6] transition-colors relative group rounded-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification dot */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <div className={`absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-2xl z-50 transition-all duration-300 ease-out ${showNotificationsDropdown
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible -translate-y-2'
                }`}>
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>}
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                          <p className="text-sm text-gray-800 font-medium truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-2 py-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        router.push('/admin/notifications');
                        setShowNotificationsDropdown(false);
                      }}
                      className="w-full py-2 text-sm text-center text-[#224fa6] font-medium hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      See all notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings with Dropdown */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setShowSettingsDropdown(true)}
              onMouseLeave={() => setShowSettingsDropdown(false)}
            >
              <button
                className="p-2 text-gray-400 hover:text-[#224fa6] transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#224fa6]/5 to-[#3270e9]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Dropdown - Simplified (only Settings link) */}
              <div className={`absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-2xl z-50 transition-all duration-300 ease-out ${showSettingsDropdown
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible -translate-y-2'
                }`}>
                <div className="py-3">
                  {/* Header */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
                    <p className="text-xs text-gray-500">Quick access</p>
                  </div>

                  {/* Settings Link */}
                  <div className="px-2 py-1 pt-2">
                    <button
                      onClick={() => {
                        router.push('/admin/settings');
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#224fa6]/10 hover:to-[#3270e9]/10 hover:text-[#224fa6] rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Settings</div>
                        <div className="text-xs text-gray-500">System configuration</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-[#224fa6] group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <button
              onClick={() => setShowInbox(true)}
              className="p-2 text-gray-400 hover:text-[#224fa6] transition-colors relative group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* Message count - can be updated based on unread messages */}
              {/* <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">2</span> */}
            </button>
          </div>
        </div>
      </div>

      {/* Inbox Component */}
      <Inbox
        isOpen={showInbox}
        onClose={() => setShowInbox(false)}
        currentUser={user}
      />

      {/* Emergency Alert Component */}
      {showEmergencyAlert && (
        <EmergencyAlert
          user={user}
          onClose={() => setShowEmergencyAlert(false)}
        />
      )}
    </header>
  );
}