'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Shield, AlertTriangle, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import CqcNotificationManager from './components/CqcNotificationManager';
import SafeguardingManager from './components/SafeguardingManager';
import RiddorManager from './components/RiddorManager';
import SarManager from './components/SarManager';

function GovernanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cqc'); // 'cqc', 'safeguarding', 'riddor', 'sar'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['cqc', 'safeguarding', 'riddor', 'sar'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const url = new URL(window.location);
    url.searchParams.set('tab', tabKey);
    window.history.replaceState({}, '', url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ ...notification, show: false })}
            />
          )}

          {/* Top Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="p-2.5 bg-gradient-to-br from-[#224fa6] to-indigo-700 text-white rounded-xl shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Governance & Compliance Trackers
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Centralized registers for CQC statutory notifications, Safeguarding alerts, HSE RIDDOR incidents, and UK GDPR Subject Access Requests.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/kpi')}
                  className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>KPI & Monthly Evaluations</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/admin/incidents')}
                  className="px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-900 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Accidents & Incidents Tracker</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/admin/investigations')}
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4 text-[#224fa6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <span>Internal Investigations Tracker</span>
                </button>
              </div>
            </div>

            {/* Navigation Tab Bar */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => handleTabChange('cqc')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'cqc'
                    ? 'bg-white text-[#224fa6] border-[#224fa6] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <Bell className="w-4 h-4 text-[#224fa6]" />
                <span>CQC Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('safeguarding')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'safeguarding'
                    ? 'bg-white text-amber-700 border-amber-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Safeguarding Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('riddor')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'riddor'
                    ? 'bg-white text-red-700 border-red-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>RIDDOR Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('sar')}
                className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'sar'
                    ? 'bg-white text-indigo-700 border-indigo-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>SAR (GDPR) Tracker</span>
              </button>
            </div>
          </div>

          {/* Active Tab Component */}
          {activeTab === 'cqc' && <CqcNotificationManager showNotification={showNotification} />}
          {activeTab === 'safeguarding' && <SafeguardingManager showNotification={showNotification} />}
          {activeTab === 'riddor' && <RiddorManager showNotification={showNotification} />}
          {activeTab === 'sar' && <SarManager showNotification={showNotification} />}
        </main>
      </div>
    </div>
  );
}

export default function GovernancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block w-8 h-8 border-4 border-[#224fa6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <GovernanceContent />
    </Suspense>
  );
}

