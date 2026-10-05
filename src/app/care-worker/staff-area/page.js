'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CareWorkerYouSaidWeDid from './components/CareWorkerYouSaidWeDid';

export default function CareWorkerStaffAreaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications', 'blog', 'newsletters', 'yousaidwedid'
  const [notificationSubTab, setNotificationSubTab] = useState('unread'); // 'unread' | 'read'
  
  // Data states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    }
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['notifications', 'blog', 'newsletters', 'yousaidwedid'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/care-worker-login');
        return;
      }

      // Fetch notifications
      const notifRes = await fetch('/api/staff-area/notifications?scope=me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success) {
          setNotifications(notifData.data || []);
          setUnreadCount(notifData.unreadCount || 0);
        }
      }

      // Fetch blogs
      const blogRes = await fetch('/api/staff-area/blog', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (blogRes.ok) {
        const blogData = await blogRes.json();
        if (blogData.success) {
          setBlogs(blogData.data || []);
        }
      }

      // Fetch newsletters
      const newsRes = await fetch('/api/staff-area/newsletters', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.success) {
          setNewsletters(newsData.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching staff area data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (notifId, title) => {
    try {
      setAcknowledgingId(notifId);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/staff-area/notifications/${notifId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Notification acknowledged and recorded!', 'success');
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notifId
              ? { ...n, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        showToast(data.error || 'Failed to acknowledge notification', 'error');
      }
    } catch (err) {
      console.error('Error acknowledging notification:', err);
      showToast('Failed to acknowledge notification', 'error');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      // Optimistic update
      setBlogs((prev) =>
        prev.map((b) => {
          if (b.id === postId) {
            const willLike = !b.hasLiked;
            return {
              ...b,
              hasLiked: willLike,
              likesCount: willLike ? b.likesCount + 1 : Math.max(0, b.likesCount - 1),
            };
          }
          return b;
        })
      );

      if (selectedPost && selectedPost.id === postId) {
        const willLike = !selectedPost.hasLiked;
        setSelectedPost({
          ...selectedPost,
          hasLiked: willLike,
          likesCount: willLike ? selectedPost.likesCount + 1 : Math.max(0, selectedPost.likesCount - 1),
        });
      }

      const res = await fetch(`/api/staff-area/blog/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === postId
              ? { ...b, hasLiked: data.liked, likesCount: data.likesCount }
              : b
          )
        );
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) => ({
            ...prev,
            hasLiked: data.liked,
            likesCount: data.likesCount,
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Filtered notifications
  const unreadNotifications = notifications.filter((n) => !n.isAcknowledged);
  const readNotifications = notifications.filter((n) => n.isAcknowledged);

  const displayedNotifications =
    notificationSubTab === 'unread' ? unreadNotifications : readNotifications;

  const filteredDisplayedNotifs = displayedNotifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-24 lg:bottom-8 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-green-50 text-green-800 border-green-200'
          }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#224fa6] via-[#2a5ec7] to-[#3270e9] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100 mb-2">
            Staff Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff Area</h1>
          <p className="mt-1 text-sm text-blue-100 max-w-2xl leading-relaxed">
            Stay informed with mandatory company memos, team announcements, read our blog articles, and browse through team newsletters.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-36 -top-6 w-36 h-36 bg-blue-300/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex flex-wrap gap-1">
        <button
          onClick={() => handleTabChange('notifications')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'notifications'
              ? 'bg-[#224fa6] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Formal Notifications
          {unreadCount > 0 && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                activeTab === 'notifications'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('blog')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'blog'
              ? 'bg-[#224fa6] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          Company Blog
          {blogs.length > 0 && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                activeTab === 'blog' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {blogs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('newsletters')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'newsletters'
              ? 'bg-[#224fa6] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
          </svg>
          Newsletters
          {newsletters.length > 0 && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                activeTab === 'newsletters' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {newsletters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('yousaidwedid')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'yousaidwedid'
              ? 'bg-[#224fa6] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          You Said, We Did
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: FORMAL NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              {/* Sub-tabs: Unread vs Read Archive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationSubTab('unread')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                      notificationSubTab === 'unread'
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Pending Acknowledgement ({unreadNotifications.length})
                  </button>

                  <button
                    onClick={() => setNotificationSubTab('read')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                      notificationSubTab === 'read'
                        ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Read Notifications Archive ({readNotifications.length})
                  </button>
                </div>

                <div className="w-full sm:w-64 relative">
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Notification List */}
              {filteredDisplayedNotifs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {notificationSubTab === 'unread'
                      ? 'You are all caught up!'
                      : 'No Read Notifications Yet'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {notificationSubTab === 'unread'
                      ? 'No pending formal notices requiring your acknowledgement.'
                      : 'Notices that you acknowledge will be permanently archived here for reference.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDisplayedNotifs.map((notif) => {
                    const priorityBadge =
                      notif.priority === 'URGENT' ? (
                        <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Urgent Notice
                        </span>
                      ) : notif.priority === 'HIGH' ? (
                        <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          High Priority
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Official Notice
                        </span>
                      );

                    const isOverdue =
                      !notif.isAcknowledged &&
                      notif.acknowledgeByDate &&
                      new Date(notif.acknowledgeByDate) < new Date();

                    return (
                      <div
                        key={notif.id}
                        className={`bg-white rounded-3xl border transition-all p-5 sm:p-7 shadow-sm ${
                          notif.isAcknowledged
                            ? 'border-gray-100'
                            : 'border-blue-200/80 ring-1 ring-blue-100'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            {priorityBadge}
                            {notif.isAcknowledged ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Acknowledged on {new Date(notif.acknowledgedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                Requires Your Acknowledgement
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-400">
                            Sent {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>

                        <div className="py-4 space-y-3">
                          <h3 className="text-xl font-bold text-gray-900">{notif.title}</h3>

                          <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                            {notif.body}
                          </div>

                          {notif.acknowledgeByDate && (
                            <p
                              className={`text-xs font-semibold flex items-center gap-1.5 ${
                                isOverdue ? 'text-red-600 font-bold' : 'text-amber-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Acknowledgement Due Date:{' '}
                              {new Date(notif.acknowledgeByDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                              {isOverdue && ' (Overdue)'}
                            </p>
                          )}
                        </div>

                        {/* Action Box */}
                        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="text-xs text-gray-400">
                            Issued by Management: <span className="text-gray-600 font-semibold">{notif.createdBy ? `${notif.createdBy.firstName} ${notif.createdBy.lastName}` : 'Administration'}</span>
                          </div>

                          {!notif.isAcknowledged ? (
                            <button
                              onClick={() => handleAcknowledge(notif.id, notif.title)}
                              disabled={acknowledgingId === notif.id}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                            >
                              {acknowledgingId === notif.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Confirming...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  I have read and understood this notice
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-3.5 py-2 rounded-xl">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Acknowledged and archived
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMPANY BLOG */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              {blogs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Blog Articles Yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    New articles, team stories, and tips will appear here soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {post.coverImage ? (
                          <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                              onClick={() => handleToggleLike(post.id)}
                              className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md hover:scale-110 active:scale-95 transition-all"
                            >
                              <svg
                                className={`w-4 h-4 transition-colors ${
                                  post.hasLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                                }`}
                                viewBox="0 0 20 20"
                                fill={post.hasLiked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.hasLiked ? 0 : 2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                              </svg>
                              <span className="text-xs font-bold text-gray-800">{post.likesCount}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-gradient-to-r from-blue-500/10 via-[#224fa6]/10 to-indigo-500/10 p-4 flex justify-between items-start">
                            <span className="text-[11px] font-semibold text-blue-700 bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                              Company Blog
                            </span>
                            <button
                              onClick={() => handleToggleLike(post.id)}
                              className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:scale-110 active:scale-95 transition-all"
                            >
                              <svg
                                className={`w-4 h-4 transition-colors ${
                                  post.hasLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                                }`}
                                viewBox="0 0 20 20"
                                fill={post.hasLiked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.hasLiked ? 0 : 2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                              </svg>
                              <span className="text-xs font-bold text-gray-800">{post.likesCount}</span>
                            </button>
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-gray-600">
                              {post.createdBy ? `${post.createdBy.firstName} ${post.createdBy.lastName}` : 'Management'}
                            </span>
                          </div>

                          <h3
                            onClick={() => setSelectedPost(post)}
                            className="text-base font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors mb-2 line-clamp-2 cursor-pointer"
                          >
                            {post.title}
                          </h3>

                          <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                            {post.excerpt || post.content}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-xs font-semibold text-[#224fa6] hover:underline inline-flex items-center gap-1"
                        >
                          Read full article
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            post.hasLiked
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${post.hasLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                            viewBox="0 0 20 20"
                            fill={post.hasLiked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.hasLiked ? 0 : 2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          {post.hasLiked ? 'Liked' : 'Like'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEWSLETTERS */}
          {activeTab === 'newsletters' && (
            <div className="space-y-6">
              {newsletters.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Newsletters Uploaded Yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Company publications and bulletins will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {newsletters.map((newsletter) => (
                    <div
                      key={newsletter.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              PDF Edition
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(newsletter.publishedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <h4 className="text-base font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors mb-2 line-clamp-1">
                          {newsletter.title}
                        </h4>

                        {newsletter.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                            {newsletter.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">
                          By {newsletter.createdBy ? `${newsletter.createdBy.firstName} ${newsletter.createdBy.lastName}` : 'Management'}
                        </div>

                        <a
                          href={newsletter.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#224fa6] hover:bg-blue-800 px-3.5 py-2 rounded-xl shadow-sm transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                          </svg>
                          Read PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: YOU SAID, WE DID */}
          {activeTab === 'yousaidwedid' && (
            <CareWorkerYouSaidWeDid onShowToast={showToast} />
          )}
        </>
      )}

      {/* Full Article Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#224fa6] flex items-center justify-center font-bold text-sm">
                  {selectedPost.createdBy?.firstName?.[0] || 'M'}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-900">
                    {selectedPost.createdBy ? `${selectedPost.createdBy.firstName} ${selectedPost.createdBy.lastName}` : 'Management'}
                  </h5>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedPost.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 sleek-scrollbar space-y-5">
              {selectedPost.coverImage && (
                <div className="rounded-2xl overflow-hidden max-h-72 w-full bg-gray-100">
                  <img
                    src={selectedPost.coverImage}
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {selectedPost.title}
              </h2>

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-5 font-normal">
                {selectedPost.content}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => handleToggleLike(selectedPost.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  selectedPost.hasLiked
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  className={`w-4 h-4 ${selectedPost.hasLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                  fill={selectedPost.hasLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={selectedPost.hasLiked ? 0 : 2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {selectedPost.hasLiked ? 'Liked' : 'Like Post'} ({selectedPost.likesCount})
              </button>

              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
