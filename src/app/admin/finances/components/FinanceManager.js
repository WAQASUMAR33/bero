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
import { PlusCircle, Coins, BarChart2, Users, FileText, TrendingUp } from 'lucide-react';

export default function FinanceManager({ title = 'Finances & P&L Statement' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [showQuickManualModal, setShowQuickManualModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'pnl');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    } else if (!token) {
      router.push('/login');
      return;
    }
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, [router]);

  useEffect(() => {
    if (tabParam && ['pnl', 'service-users', 'transactions', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    router.push(`/admin/finances?tab=${tabId}`, { scroll: false });
  };

  const navTabs = [
    {
      id: 'pnl',
      label: 'Profit & Loss',
      shortLabel: 'P&L',
      icon: <BarChart2 className="w-4 h-4" />,
      badge: 'Live',
      badgeColor: 'emerald',
    },
    {
      id: 'service-users',
      label: 'Service User Ledgers',
      shortLabel: 'Ledgers',
      icon: <Users className="w-4 h-4" />,
      badge: '52-Wk',
      badgeColor: 'blue',
    },
    {
      id: 'transactions',
      label: 'Journal & Entries',
      shortLabel: 'Journal',
      icon: <FileText className="w-4 h-4" />,
      badge: 'Manual',
      badgeColor: 'purple',
    },
    {
      id: 'analytics',
      label: 'Performance Trends',
      shortLabel: 'Trends',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: null,
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#224fa6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Header user={user} />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 overflow-x-hidden">

          {/* ── Top Banner ── */}
          <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <div className="absolute left-1/2 bottom-0 w-40 h-40 bg-white/5 rounded-full -mb-12 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Comprehensive operational accounting & P&L tracking — revenues, outgoings, EBITDARM margins, and resident weekly ledgers.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuickManualModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white text-[#173a7a] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 text-[#224fa6]" />
                  <span className="hidden xs:inline">Post Financial Entry</span>
                  <span className="xs:hidden">Post Entry</span>
                </button>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Finance Hub
                </span>
              </div>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          {/* Desktop: horizontal pill tabs */}
          <div className="bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm hidden sm:flex flex-wrap items-center gap-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#224fa6]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile: segmented control */}
          <div className="sm:hidden grid grid-cols-4 gap-1 bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* ── Tab Content ── */}
          <div className="min-w-0">
            {activeTab === 'pnl' && <PnlManager onNotification={setNotification} />}
            {activeTab === 'service-users' && <ServiceUserFinancesHub onNotification={setNotification} />}
            {activeTab === 'transactions' && (
              <FinancialTransactionsHub onTransactionChange={() => {
                setNotification({ show: true, message: 'Financial ledger updated and synced with P&L', type: 'success' });
              }} />
            )}
            {activeTab === 'analytics' && <FinanceAnalyticsView onNotification={setNotification} />}
          </div>
        </main>
      </div>

      <ManualTransactionModal
        isOpen={showQuickManualModal}
        onClose={() => setShowQuickManualModal(false)}
        onSuccess={() => {
          setNotification({ show: true, message: 'Financial transaction posted and synced with P&L statement & resident ledger!', type: 'success' });
        }}
      />

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
