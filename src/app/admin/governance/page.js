'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
                <span className="text-base">🚨</span>
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
                <span className="text-base">🛡️</span>
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
                <span className="text-base">⚠️</span>
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
                <span className="text-base">📋</span>
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

