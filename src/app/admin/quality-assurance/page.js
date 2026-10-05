'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import AuditsManager from './components/AuditsManager';
import ActionPlansManager from './components/ActionPlansManager';
import LessonsLearntManager from './components/LessonsLearntManager';
import YouSaidWeDidManager from './components/YouSaidWeDidManager';

export default function QualityAssurancePage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('audits'); // 'audits', 'actions', 'feedback', 'lessons'
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    }
  };

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
      fetchServiceSeekers();
    } else {
      router.push('/login');
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['audits', 'actions', 'feedback', 'lessons'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [router]);

  const fetchServiceSeekers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/service-seekers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setServiceSeekers(data.filter(s => s.status === 'LIVE'));
      }
    } catch (error) {
      console.error('Error fetching service seekers:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Top Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="p-2.5 bg-gradient-to-br from-[#224fa6] to-[#17387a] text-white rounded-xl shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  Quality Assurance & Continuous Improvement
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  CQC Compliance, periodic audits, monthly compliance percentage trends, staff action plans, lessons learnt, and &quot;You Said, We Did&quot; feedback registers.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => handleTabChange('audits')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'audits'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Audits & Monthly Compliance</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('actions')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'actions'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Staff Action Plans</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('feedback')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'feedback'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>You Said, We Did</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('lessons')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'lessons'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Lessons Learnt</span>
              </button>
            </div>
          </div>

          {/* TAB 1: AUDITS & COMPLIANCE */}
          {activeTab === 'audits' && (
            <AuditsManager user={user} onNotification={showNotification} />
          )}

          {/* TAB 2: STAFF ACTION PLANS */}
          {activeTab === 'actions' && (
            <ActionPlansManager user={user} onNotification={showNotification} />
          )}

          {/* TAB 3: YOU SAID, WE DID (CONTINUOUS IMPROVEMENT) */}
          {activeTab === 'feedback' && (
            <YouSaidWeDidManager
              user={user}
              serviceSeekers={serviceSeekers}
              onNotification={showNotification}
            />
          )}

          {/* TAB 4: LESSONS LEARNT */}
          {activeTab === 'lessons' && (
            <LessonsLearntManager user={user} onNotification={showNotification} />
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })}
          />
        </main>
      </div>
    </div>
  );
}
