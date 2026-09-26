'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle, ArrowDownRight, ArrowUpRight, Search,
  Trash2, RefreshCw, Building, User, CreditCard, Coins
} from 'lucide-react';
import ManualTransactionModal from './ManualTransactionModal';

function formatAmount(val) {
  return val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinancialTransactionsHub({ onTransactionChange }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState('INCOMING');

  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('2026');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/transactions?year=${yearFilter}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [yearFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction? It will reverse the P&L entry.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finances/transactions?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
        if (onTransactionChange) onTransactionChange();
      } else {
        alert(data.error || 'Failed to delete transaction');
      }
    } catch { alert('Network error deleting transaction'); }
  };

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'ALL' && tx.type !== filterType) return false;
      if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const residentName = tx.serviceSeeker ? `${tx.serviceSeeker.firstName} ${tx.serviceSeeker.lastName}`.toLowerCase() : '';
        return (
          residentName.includes(q) ||
          (tx.categoryLabel || tx.category || '').toLowerCase().includes(q) ||
          (tx.houseName || '').toLowerCase().includes(q) ||
          (tx.reference || '').toLowerCase().includes(q) ||
          (tx.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, searchTerm]);

  const stats = useMemo(() => {
    let incoming = 0, outgoing = 0;
    filtered.forEach(tx => {
      if (tx.type === 'INCOMING') incoming += tx.amount;
      if (tx.type === 'OUTGOING') outgoing += tx.amount;
    });
    return { incoming, outgoing, net: incoming - outgoing, count: filtered.length };
  }, [filtered]);

  const openModal = (type) => { setInitialType(type); setShowAddModal(true); };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Incoming */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Incomings</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 mt-2">£{formatAmount(stats.incoming)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Credited to P&L & Ledgers</p>
        </div>

        {/* Outgoings */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Outgoings</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 mt-2">£{formatAmount(stats.outgoing)}</p>
          <p className="text-[11px] text-red-600 font-medium mt-1">Expenses & bills posted</p>
        </div>

        {/* Net */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#173a7a] uppercase tracking-wider">Net Balance</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#224fa6]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black mt-2 ${stats.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            £{formatAmount(stats.net)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">{stats.count} records</p>
        </div>

        {/* Quick Post */}
        <div className="bg-gradient-to-br from-[#173a7a] to-[#3270e9] rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm">Post Entry</h4>
            <p className="text-xs text-blue-100 mt-0.5">Log income or expense</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => openModal('INCOMING')}
              className="flex-1 py-2 px-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Income
            </button>
            <button
              onClick={() => openModal('OUTGOING')}
              className="flex-1 py-2 px-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Expense
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resident, house, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="INCOMING">Incoming (+)</option>
            <option value="OUTGOING">Outgoing (-)</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:outline-none cursor-pointer"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={fetchTransactions}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal('INCOMING')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Manual Input</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]" />
            <h3 className="font-bold text-sm text-gray-900">Ledger Entries ({filtered.length})</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:block">Auto P&L integration active</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6 text-[#224fa6]" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">No transactions found</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              No entries match your filters. Use "Manual Input" to log income or expenses.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '750px' }}>
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">House / Resident</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4 text-center">P&L</th>
                    <th className="py-3 px-4 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filtered.map((tx) => {
                    const isIncome = tx.type === 'INCOMING';
                    return (
                      <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-900">
                          {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isIncome ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          }`}>
                            {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-bold text-gray-900 truncate">{tx.categoryLabel || tx.category}</p>
                          {tx.description && <p className="text-[11px] text-gray-500 truncate">{tx.description}</p>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {tx.serviceSeeker ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-[#173a7a] font-semibold text-[11px]">
                              <User className="w-3 h-3" />{tx.serviceSeeker.firstName} {tx.serviceSeeker.lastName}
                            </span>
                          ) : tx.houseName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px]">
                              <Building className="w-3 h-3" />{tx.houseName}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <span className={`font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '−'}£{formatAmount(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-gray-700 font-medium">{tx.paymentMethod || 'Bank Transfer'}</p>
                          {tx.reference && <p className="text-[10px] text-gray-400 font-mono">{tx.reference}</p>}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Synced
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((tx) => {
                const isIncome = tx.type === 'INCOMING';
                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{tx.categoryLabel || tx.category}</p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-base font-black font-mono block ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '−'}£{formatAmount(tx.amount)}
                        </span>
                        <span className={`text-[10px] font-bold ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isIncome ? 'INCOMING' : 'OUTGOING'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        {tx.serviceSeeker ? (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{tx.serviceSeeker.firstName} {tx.serviceSeeker.lastName}</span>
                        ) : tx.houseName ? (
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{tx.houseName}</span>
                        ) : null}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ManualTransactionModal
        isOpen={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { fetchTransactions(); if (onTransactionChange) onTransactionChange(); }}
      />
    </div>
  );
}
