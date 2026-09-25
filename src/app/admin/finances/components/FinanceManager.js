'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Notification from '../../components/Notification';
import PnlManager from './PnlManager';
import ServiceUserFinancesHub from './ServiceUserFinancesHub';
import FinanceAnalyticsView from './FinanceAnalyticsView';
import FinancialTransactionsHub from './FinancialTransactionsHub';
import ManualTransactionModal from './ManualTransactionModal';
import { PlusCircle } from 'lucide-react';

export default function FinanceManager({ title = 'Finances & P&L Statement' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [showQuickManualModal, setShowQuickManualModal] = useState(false);

  // Tab State: 'pnl', 'service-users', 'transactions', 'analytics'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'pnl');

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Fetch logged in user
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (tabParam && ['pnl', 'service-users', 'transactions', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/admin/finances?tab=${tabId}`, { scroll: false });
  };

  const navTabs = [
    {
      id: 'pnl',
      label: 'Profit & Loss (P&L)',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: 'Live',
    },
    {
      id: 'service-users',
      label: 'Service User Finances & Ledgers',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: '52-Wk Ledger',
    },
    {
      id: 'transactions',
      label: 'Manual Journal & Entries',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: 'Manual Input',
    },
    {
      id: 'analytics',
      label: 'Performance Trends',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md text-xl">💷</span>
                  <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
                  Comprehensive operational accounting & P&L tracking. Monitor organization revenues, outgoings, EBITDARM profit margins, and resident weekly ledgers.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickManualModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173a7a] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#224fa6]" />
                  <span>+ Post Financial Entry</span>
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Beerusys Finance Hub
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-xs flex flex-wrap items-center gap-2">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#224fa6]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-View Content */}
          {activeTab === 'pnl' && (
            <PnlManager onNotification={setNotification} />
          )}

          {activeTab === 'service-users' && (
            <ServiceUserFinancesHub onNotification={setNotification} />
          )}

          {activeTab === 'transactions' && (
            <FinancialTransactionsHub onTransactionChange={() => {
              setNotification({ show: true, message: 'Financial ledger updated and synced with P&L', type: 'success' });
            }} />
          )}

          {activeTab === 'analytics' && (
            <FinanceAnalyticsView onNotification={setNotification} />
          )}
        </main>
      </div>

      {/* Quick Manual Transaction Modal */}
      <ManualTransactionModal
        isOpen={showQuickManualModal}
        onClose={() => setShowQuickManualModal(false)}
        onSuccess={() => {
          setNotification({ show: true, message: 'Financial transaction posted and synced with P&L statement & resident ledger!', type: 'success' });
          if (activeTab === 'transactions') {
            // refresh happens in component
          }
        }}
      />

      {/* Global Notification Toast */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
}
