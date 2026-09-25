'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Trash2, 
  FileSpreadsheet, 
  RefreshCw,
  Building,
  User,
  CreditCard,
  Calendar
} from 'lucide-react';
import ManualTransactionModal from './ManualTransactionModal';

export default function FinancialTransactionsHub({ onTransactionChange }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState('INCOMING');

  // Filters
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
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [yearFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction? It will also reverse the entry in the P&L statement.')) {
      return;
    }

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
    } catch (err) {
      console.error(err);
      alert('Network error deleting transaction');
    }
  };

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'ALL' && tx.type !== filterType) return false;
      if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const residentName = tx.serviceSeeker ? `${tx.serviceSeeker.firstName} ${tx.serviceSeeker.lastName}`.toLowerCase() : '';
        const cat = (tx.categoryLabel || tx.category || '').toLowerCase();
        const house = (tx.houseName || '').toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();

        return residentName.includes(q) || cat.includes(q) || house.includes(q) || ref.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    filtered.forEach(tx => {
      if (tx.type === 'INCOMING') incoming += tx.amount;
      if (tx.type === 'OUTGOING') outgoing += tx.amount;
    });
    return {
      incoming,
      outgoing,
      net: incoming - outgoing,
      count: filtered.length
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Top Controls & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incoming */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Incomings</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">£{stats.incoming.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Directly credited to P&L & Ledgers</p>
        </div>

        {/* Total Outgoings */}
        <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Outgoings</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">£{stats.outgoing.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-red-600 font-medium mt-1">Expenses & bills posted</p>
        </div>

        {/* Net Cashflow */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#173a7a] uppercase tracking-wider">Net Cash Balance</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#224fa6]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${stats.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            £{stats.net.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-1">{stats.count} transaction records</p>
        </div>

        {/* Quick Post Actions */}
        <div className="bg-gradient-to-br from-[#173a7a] to-[#224fa6] rounded-2xl p-5 text-white shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm">Post Financial Entry</h4>
            <p className="text-xs text-blue-100 mt-0.5">Quick manual entry with explanation dropdowns</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => { setInitialType('INCOMING'); setShowAddModal(true); }}
              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Income
            </button>
            <button
              onClick={() => { setInitialType('OUTGOING'); setShowAddModal(true); }}
              className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              - Expense
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search resident, house, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="INCOMING">Incoming Only (+)</option>
            <option value="OUTGOING">Outgoing Only (-)</option>
          </select>

          {/* Year selector */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white"
          >
            <option value="2025">Year 2025</option>
            <option value="2026">Year 2026</option>
            <option value="2027">Year 2027</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchTransactions}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setInitialType('INCOMING'); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Input</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#224fa6]"></span>
            <h3 className="font-bold text-sm text-gray-900">Financial Ledger Entries ({filtered.length})</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">Automatic P&L integration active</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#224fa6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-gray-500">Loading financial transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto text-xl">
              💷
            </div>
            <h4 className="font-bold text-gray-900 text-sm">No transactions found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No entries match the current search or filters. Use the "Manual Input" button above to log income or expenses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category / Explanation</th>
                  <th className="py-3 px-4">House / Resident</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4 text-center">P&L Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filtered.map((tx) => {
                  const txDate = new Date(tx.date);
                  const isIncome = tx.type === 'INCOMING';

                  return (
                    <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {txDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                        }`}>
                          {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{tx.categoryLabel || tx.category}</p>
                        {tx.description && (
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">{tx.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.serviceSeeker ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-[#173a7a] font-semibold text-[11px]">
                            <User className="w-3 h-3" />
                            {tx.serviceSeeker.firstName} {tx.serviceSeeker.lastName}
                          </span>
                        ) : tx.houseName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            <Building className="w-3 h-3" />
                            {tx.houseName}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span className={`font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}£{tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-gray-900 font-medium">{tx.paymentMethod || 'Bank Transfer'}</p>
                        {tx.reference && <p className="text-[10px] text-gray-500 font-mono">{tx.reference}</p>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          ✓ Synced
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete entry"
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
        )}
      </div>

      {/* Manual Transaction Modal */}
      <ManualTransactionModal
        isOpen={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchTransactions();
          if (onTransactionChange) onTransactionChange();
        }}
      />
    </div>
  );
}
