'use client';

import { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, Building, User, FileText, Coins, AlertTriangle, Zap } from 'lucide-react';

export default function ManualTransactionModal({ isOpen, onClose, onSuccess, initialType = 'INCOMING' }) {
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialType === 'INCOMING' ? 'SERVICE_USER_FEES' : 'ELECTRICITY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [houseName, setHouseName] = useState('');
  const [serviceSeekerId, setServiceSeekerId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');

  const [serviceUsers, setServiceUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch service seekers & regions/properties for dropdowns
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch service users
        const suRes = await fetch('/api/service-seekers', { headers });
        if (suRes.ok) {
          const suData = await suRes.json();
          const list = Array.isArray(suData) ? suData : (suData.data || []);
          setServiceUsers(list);
        }

        // Fetch regions/houses
        const regRes = await fetch('/api/regions', { headers });
        if (regRes.ok) {
          const regData = await regRes.json();
          const list = regData.success ? regData.data : (Array.isArray(regData) ? regData : []);
          setRegions(list);
          if (list.length > 0 && !houseName) {
            setHouseName(list[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    setType(initialType);
    setCategory(initialType === 'INCOMING' ? 'SERVICE_USER_FEES' : 'ELECTRICITY');
  }, [initialType, isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'INCOMING') {
      setCategory('SERVICE_USER_FEES');
    } else {
      setCategory('ELECTRICITY');
    }
  };

  const getCategoryLabel = () => {
    const selectedSU = serviceUsers.find(s => s.id === parseInt(serviceSeekerId));
    const suName = selectedSU ? `${selectedSU.firstName} ${selectedSU.lastName}` : 'Service User';
    const house = houseName || 'Property';

    if (type === 'INCOMING') {
      if (category === 'SERVICE_USER_FEES') return `${suName} - Care & Support Fees`;
      if (category === 'SERVICE_USER_RENT') return `${suName} - Rent Payment`;
      if (category === 'SERVICE_USER_UTILITIES') return `${suName} - Utilities Contribution`;
      return 'Other Incoming Funds';
    } else {
      const labels = {
        'ELECTRICITY': `${house} - Electricity Bill`,
        'GAS': `${house} - Gas Bill`,
        'WATER': `${house} - Water Rates`,
        'COUNCIL_TAX': `${house} - Council Tax`,
        'TV_LICENCE': `${house} - TV Licence`,
        'INTERNET': `${house} - Internet & Broadband`,
        'FURNISHINGS': `${house} - Furnishings & Equipment`,
        'MAINTENANCE': `${house} - Maintenance & Repairs`,
        'INSURANCE': `${house} - Insurance`,
        'WAGES': 'Staff Wages & Payroll',
        'RENT': `${house} - Property Rent / Lease`,
        'OTHER': 'Other Operational Outgoings'
      };
      return labels[category] || `${house} - ${category}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'INCOMING' && ['SERVICE_USER_FEES', 'SERVICE_USER_RENT', 'SERVICE_USER_UTILITIES'].includes(category) && !serviceSeekerId) {
      setError('Please select a Service User for this category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        type,
        category,
        categoryLabel: getCategoryLabel(),
        date,
        amount: parseFloat(amount),
        houseName: houseName || null,
        serviceSeekerId: serviceSeekerId ? parseInt(serviceSeekerId, 10) : null,
        description,
        paymentMethod,
        reference
      };

      const res = await fetch('/api/finances/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isServiceUserCategory = type === 'INCOMING' && ['SERVICE_USER_FEES', 'SERVICE_USER_RENT', 'SERVICE_USER_UTILITIES'].includes(category);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Manual Financial Input</h3>
              <p className="text-xs text-blue-100">Log incoming revenues or outgoing expenses (pulls to P&L & Ledgers)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form — scrollable body */}
        <form id="manual-tx-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Incoming vs Outgoing) */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOMING')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                type === 'INCOMING'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Incoming (Money In)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('OUTGOING')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                type === 'OUTGOING'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Outgoing (Expenses / Bills)
            </button>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Transaction Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Amount (£) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Financial Category & Explanation *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white"
            >
              {type === 'INCOMING' ? (
                <>
                  <option value="SERVICE_USER_FEES">Service User - Care & Support Fees</option>
                  <option value="SERVICE_USER_RENT">Service User - Rent Payment</option>
                  <option value="SERVICE_USER_UTILITIES">Service User - Utilities Contribution</option>
                  <option value="OTHER_INCOMING">Other Incoming (Grant, Local Authority, Funding)</option>
                </>
              ) : (
                <>
                  <option value="ELECTRICITY">House Electricity Bill</option>
                  <option value="GAS">House Gas Bill</option>
                  <option value="WATER">House Water Rates</option>
                  <option value="COUNCIL_TAX">House Council Tax</option>
                  <option value="TV_LICENCE">House TV Licence</option>
                  <option value="INTERNET">House Internet & Broadband</option>
                  <option value="FURNISHINGS">House Furnishings & Equipment</option>
                  <option value="MAINTENANCE">House Maintenance & Repairs</option>
                  <option value="INSURANCE">Insurance Premiums</option>
                  <option value="WAGES">Staff Wages & Payroll</option>
                  <option value="RENT">House Rent / Property Lease</option>
                  <option value="OTHER">Other Operational Outgoings</option>
                </>
              )}
            </select>
          </div>

          {/* Service User Selector (When category is Service User related) */}
          {isServiceUserCategory && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-[#173a7a]">
                Select Service User * (Pulls directly to their weekly financial ledger)
              </label>
              <select
                required={isServiceUserCategory}
                value={serviceSeekerId}
                onChange={(e) => setServiceSeekerId(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white font-medium"
              >
                <option value="">-- Choose Resident / Service User --</option>
                {serviceUsers.map((su) => (
                  <option key={su.id} value={su.id}>
                    {su.firstName} {su.lastName} {su.preferredName ? `(${su.preferredName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* House / Property Name (When Outgoing or general) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              House / Property Name (e.g. Rosewood House, Elm Lodge)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                list="house-suggestions"
                placeholder="Enter or select House / Property..."
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
              <datalist id="house-suggestions">
                {regions.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white"
              >
                <option value="Bank Transfer">Bank Transfer (BACS)</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Standing Order">Standing Order</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Reference / Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-9042, BACS-MAY26"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional details regarding this transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>

          {/* Automatic sync badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <Zap className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>
              <strong>Automatic Pull-Through:</strong> Saving will immediately credit/debit the <strong>{new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })} P&L statement</strong>
              {isServiceUserCategory ? ' and post to the service user\'s 52-week ledger.' : '.'}
            </span>
          </div>

        </form>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="manual-tx-form"
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
              type === 'INCOMING'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#224fa6] hover:bg-[#1a3d82]'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Post Financial Entry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
