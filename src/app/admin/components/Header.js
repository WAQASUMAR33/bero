'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Inbox from './Inbox';
import EmergencyAlert from './EmergencyAlert';
import PushNotificationToggle from '@/components/PushNotificationToggle';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/manage-rota': 'Manage Rota',
  '/admin/my-rota': 'My Rota',
  '/admin/service-users': 'Service Users',
  '/admin/care-plan': 'Care Plans',
  '/admin/daily-tasks': 'Daily Tasks',
  '/admin/handovers': 'Handovers',
  '/admin/staff-management': 'Staff Management',
  '/admin/teams': 'Teams',
  '/admin/shift-run-management': 'Shift Run Management',
  '/admin/calendar': 'Calendar',
  '/admin/holidays': 'Holidays & Leave',
  '/admin/cqc-inspection': 'CQC Inspection',
  '/admin/cqc-inspection/late-arrivals': 'CQC Late Arrivals',
  '/admin/cqc-inspection/staff-overworked': 'CQC Staff Overworked',
  '/admin/policy-procedures': 'Policies & Procedures',
  '/admin/quality-assurance': 'Quality Assurance',
  '/admin/ppe-stock': 'PPE Stock Management',
  '/admin/maintenance': 'Maintenance Issues',
  '/admin/emergency-reports': 'Emergency Reports',
  '/admin/clock-in-out': 'Clock In / Out Records',
  '/admin/role-management': 'Role Management',
  '/admin/region-management': 'Region Management',
  '/admin/funder-management': 'Funder Management',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
  '/admin/profile': 'My Profile'
};

export default function Header({ user }) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // Live Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Compute active page title
  const activeTitle = useMemo(() => {
    if (pathname && PAGE_TITLES[pathname]) {
      return PAGE_TITLES[pathname];
    }
    if (pathname?.includes('/admin/service-users/') && pathname?.includes('/admission')) {
      return 'Service User Admission';
    }
    if (pathname?.includes('/admin/care-plan/') && pathname?.includes('/view')) {
      return 'Care Plan View';
    }
    return 'Dashboard';
  }, [pathname]);

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

    fetchEmergencyCount();
    pollingIntervalRef.current = setInterval(fetchEmergencyCount, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [canViewEmergencies]);

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    let lastAdminCheck = 0;
    const ADMIN_CHECK_COOLDOWN = 120000;

    const fetchNotifications = async () => {
      if (!isMounted) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/notifications?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!isMounted) return;
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const triggerAdminCheck = async () => {
      if (!canViewEmergencies || !isMounted) return;
      const now = Date.now();
      if (now - lastAdminCheck < ADMIN_CHECK_COOLDOWN) return;
      lastAdminCheck = now;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/api/notifications/admin-check', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) fetchNotifications();
      } catch (error) {
        console.error('Admin check error:', error);
      }
    };

    fetchNotifications();

    const initialAdminCheck = setTimeout(() => {
      if (canViewEmergencies) triggerAdminCheck();
    }, 5000);

    const interval = setInterval(fetchNotifications, 45000);
    const adminInterval = setInterval(triggerAdminCheck, 120000);

    return () => {
      isMounted = false;
      clearTimeout(initialAdminCheck);
      clearInterval(interval);
      clearInterval(adminInterval);
    };
  }, [canViewEmergencies]);

  // Fetch unread messages
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/conversations?countOnly=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.conversations) {
        const totalUnread = data.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnreadMessages(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismissNotification = async (id) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;

      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const token = localStorage.getItem('token');
      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Real-time Search Execution with Debounce and AbortController
  const performSearch = useCallback(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setSelectedIndex(-1);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle Search Input Change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 180); // Fast 180ms responsive debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global shortcut (Ctrl+K / Cmd+K or /) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Flatten all visible search results into a single indexable list for keyboard navigation
  const flattenedResults = useMemo(() => {
    if (!searchResults) return [];
    const list = [];

    (searchResults.pages || []).forEach(item => {
      list.push({ type: 'page', item, link: item.path, label: item.name });
    });
    (searchResults.serviceUsers || []).forEach(item => {
      list.push({ type: 'serviceUser', item, link: `/admin/service-users/${item.id}/admission`, label: `${item.firstName} ${item.lastName}` });
    });
    (searchResults.staff || []).forEach(item => {
      list.push({ type: 'staff', item, link: `/admin/staff-management`, label: `${item.firstName} ${item.lastName}` });
    });
    (searchResults.teams || []).forEach(item => {
      list.push({ type: 'team', item, link: `/admin/teams`, label: item.name });
    });
    (searchResults.policies || []).forEach(item => {
      list.push({ type: 'policy', item, link: `/admin/policy-procedures`, label: item.name });
    });
    (searchResults.maintenance || []).forEach(item => {
      list.push({ type: 'maintenance', item, link: `/admin/maintenance`, label: item.issue || item.issueType });
    });
    (searchResults.qualityAssurance || []).forEach(item => {
      list.push({ type: 'qa', item, link: `/admin/quality-assurance`, label: `${item.type} from ${item.from}` });
    });

    return list;
  }, [searchResults]);

  const handleNavigateItem = (target) => {
    setIsSearchOpen(false);
    if (target.link) {
      router.push(target.link);
    }
  };

  const handleInputKeyDown = (e) => {
    if (!isSearchOpen || flattenedResults.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsSearchOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flattenedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flattenedResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        handleNavigateItem(flattenedResults[selectedIndex]);
      } else if (flattenedResults.length > 0) {
        handleNavigateItem(flattenedResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-30">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activeTitle}</h1>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Real-Time Live Search Bar */}
          <div className="relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              {/* Search Icon */}
              <div className="absolute left-3 pointer-events-none text-gray-400">
                {isSearching ? (
                  <svg className="w-4 h-4 animate-spin text-[#224fa6]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (!isSearchOpen) setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search anything... (Ctrl+K)"
                className="pl-9 pr-16 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#224fa6] focus:border-transparent w-64 md:w-80 transition-all duration-200 shadow-sm"
              />

              {/* Clear / Shortcut Badge */}
              <div className="absolute right-2.5 flex items-center space-x-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                      setSelectedIndex(-1);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded shadow-xs">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[480px] bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header info */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-[#224fa6] animate-pulse"></span>
                    <span>Live Search Results</span>
                  </div>
                  {searchResults && (
                    <span className="text-[11px] text-gray-500 font-medium">
                      {searchResults.totalCount} {searchResults.totalCount === 1 ? 'match' : 'matches'}
                    </span>
                  )}
                </div>

                {/* Content Area */}
                <div className="max-h-[68vh] overflow-y-auto divide-y divide-gray-100/80 p-2 space-y-2">
                  {/* Loading State */}
                  {isSearching && !searchResults && (
                    <div className="py-10 text-center text-gray-500 text-sm">
                      <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
                      Searching across database...
                    </div>
                  )}

                  {/* Empty Results */}
                  {!isSearching && searchResults && searchResults.totalCount === 0 && (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No results found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        No matches found for <span className="font-medium text-gray-900">&quot;{searchQuery}&quot;</span>
                      </p>
                    </div>
                  )}

                  {/* 1. Pages & Navigation Quick Links */}
                  {searchResults?.pages?.length > 0 && (
                    <div className="pt-1">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Pages & Actions
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.pages.map((p) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'page' && r.item.path === p.path);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <button
                              key={p.path}
                              onClick={() => handleNavigateItem({ link: p.path })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#224fa6]'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{p.name}</div>
                                <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{p.description}</div>
                              </div>
                              <svg className={`w-4 h-4 ml-2 opacity-60 ${isSelected ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Service Users (Residents) */}
                  {searchResults?.serviceUsers?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Service Users ({searchResults.serviceUsers.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.serviceUsers.map((su) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'serviceUser' && r.item.id === su.id);
                          const isSelected = selectedIndex === flatIdx;
                          const fullName = `${su.firstName} ${su.lastName}`;
                          return (
                            <button
                              key={su.id}
                              onClick={() => handleNavigateItem({ link: `/admin/service-users/${su.id}/admission` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              {su.photoUrl ? (
                                <img
                                  src={su.photoUrl}
                                  alt={fullName}
                                  className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-200"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {su.firstName?.[0]}{su.lastName?.[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold truncate">{fullName}</span>
                                  {su.preferredName && (
                                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                      ({su.preferredName})
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] flex items-center space-x-2 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {su.roomNumber && <span>Room: {su.roomNumber}</span>}
                                  {su.status && (
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {su.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ml-2 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#224fa6]'
                              }`}>
                                Profile
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Staff Members */}
                  {searchResults?.staff?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Staff Members ({searchResults.staff.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.staff.map((st) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'staff' && r.item.id === st.id);
                          const isSelected = selectedIndex === flatIdx;
                          const fullName = `${st.firstName} ${st.lastName}`;
                          return (
                            <button
                              key={st.id}
                              onClick={() => handleNavigateItem({ link: `/admin/staff-management` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              {st.profilePic ? (
                                <img
                                  src={st.profilePic}
                                  alt={fullName}
                                  className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-200"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {st.firstName?.[0]}{st.lastName?.[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold truncate">{fullName}</span>
                                  {st.role?.displayName && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {st.role.displayName}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {st.email || st.phoneNo || st.username}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Teams */}
                  {searchResults?.teams?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Teams ({searchResults.teams.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.teams.map((t) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'team' && r.item.id === t.id);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleNavigateItem({ link: `/admin/teams` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{t.name}</div>
                                <div className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {t._count?.members || 0} members
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. Policies */}
                  {searchResults?.policies?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Policies & Procedures
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.policies.map((p) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'policy' && r.item.id === p.id);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleNavigateItem({ link: `/admin/policy-procedures` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{p.name}</div>
                                <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {p.fileName}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. Maintenance */}
                  {searchResults?.maintenance?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Maintenance
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.maintenance.map((m) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'maintenance' && r.item.id === m.id);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <button
                              key={m.id}
                              onClick={() => handleNavigateItem({ link: `/admin/maintenance` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{m.issueType} {m.for ? `(${m.for})` : ''}</div>
                                <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{m.issue}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 7. Quality Assurance */}
                  {searchResults?.qualityAssurance?.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Quality Assurance
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.qualityAssurance.map((qa) => {
                          const flatIdx = flattenedResults.findIndex(r => r.type === 'qa' && r.item.id === qa.id);
                          const isSelected = selectedIndex === flatIdx;
                          return (
                            <button
                              key={qa.id}
                              onClick={() => handleNavigateItem({ link: `/admin/quality-assurance` })}
                              className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-all ${
                                isSelected ? 'bg-[#224fa6] text-white shadow-sm' : 'hover:bg-blue-50 text-gray-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">{qa.type} from {qa.from}</div>
                                {qa.youSaid && (
                                  <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{qa.youSaid}</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with keyboard hints */}
                <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center space-x-3">
                    <span><kbd className="font-mono bg-white px-1.5 py-0.5 border rounded">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 border rounded">↓</kbd> Navigate</span>
                    <span><kbd className="font-mono bg-white px-1.5 py-0.5 border rounded">↵</kbd> Open</span>
                    <span><kbd className="font-mono bg-white px-1.5 py-0.5 border rounded">Esc</kbd> Close</span>
                  </div>
                  <span className="font-medium text-[#224fa6]">Beeru Quick Finder</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Push Notification Toggle */}
            <PushNotificationToggle />

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
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-800 font-medium truncate pr-6">{n.title}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(n.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Dismiss"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
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

              {/* Settings Dropdown */}
              <div className={`absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-2xl z-50 transition-all duration-300 ease-out ${showSettingsDropdown
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible -translate-y-2'
                }`}>
                <div className="py-3">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
                    <p className="text-xs text-gray-500">Quick access</p>
                  </div>

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
              className="p-2 text-gray-400 hover:text-[#224fa6] transition-colors relative group rounded-lg hover:bg-gray-50"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold px-1.5 animate-pulse ring-2 ring-white">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inbox Component */}
      <Inbox
        isOpen={showInbox}
        onClose={() => {
          setShowInbox(false);
          fetchUnreadMessages();
        }}
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