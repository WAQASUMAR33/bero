'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import NewsletterManager from './components/NewsletterManager';
import BlogManager from './components/BlogManager';
import NotificationsManager from './components/NotificationsManager';

export default function StaffAreaAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications', 'newsletters', 'blog'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    if (typeof message === 'object' && message !== null) {
      setNotification({ show: true, message: message.message || '', type: message.type || 'success' });
    } else {
      setNotification({ show: true, message, type });
    }
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['notifications', 'newsletters', 'blog'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#224fa6] via-[#2a5ec7] to-[#3270e9] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-100 mb-2">
                  Staff Communications & Governance
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff Area</h1>
                <p className="mt-1 text-sm text-blue-100 max-w-2xl leading-relaxed">
                  Publish company newsletters, share internal blog updates, and broadcast formal memo notifications with mandatory staff read-acknowledgement tracking.
                </p>
              </div>

              {/* Decorative shapes */}
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute right-32 -top-10 w-40 h-40 bg-blue-300/10 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex flex-wrap gap-1">
              {[
                {
                  id: 'notifications',
                  label: 'Formal Notifications',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ),
                },
                {
                  id: 'newsletters',
                  label: 'Newsletters',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  ),
                },
                {
                  id: 'blog',
                  label: 'Company Blog',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  ),
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#224fa6] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panes */}
            <div>
              {activeTab === 'notifications' && (
                <NotificationsManager showNotification={showNotification} />
              )}
              {activeTab === 'newsletters' && (
                <NewsletterManager showNotification={showNotification} />
              )}
              {activeTab === 'blog' && (
                <BlogManager showNotification={showNotification} />
              )}
            </div>
          </div>
        </main>
      </div>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}
