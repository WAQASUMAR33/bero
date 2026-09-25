'use client';

import { useState, useEffect } from 'react';
import { X, PlusCircle, DollarSign, Clock, FileText } from 'lucide-react';

export default function WageManualEntryModal({ isOpen, onClose, onSuccess, initialUserId = '', staffList = [] }) {
  const [userId, setUserId] = useState(initialUserId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState('HOURS_ADJUSTMENT');
  const [hours, setHours] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    } else if (staffList.length > 0 && !userId) {
      const firstId = staffList[0]?.id || staffList[0]?.user?.id || '';
      if (firstId) setUserId(firstId);
    }
  }, [initialUserId, staffList, isOpen]);

  // When hours changes, auto-suggest amount based on hourly rate if available
  const handleHoursChange = (val) => {
    setHours(val);
    const selectedStaff = staffList.find(s => (s?.id || s?.user?.id) === parseInt(userId, 10));
    const rate = selectedStaff?.rateOfPay || selectedStaff?.user?.rateOfPay || 12.50;
    if (val && parseFloat(val) > 0) {
      setAmount((parseFloat(val) * rate).toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Please select a staff member.');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please provide a valid amount (£).');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wages/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: parseInt(userId, 10),
          date,
          entryType,
          hours: hours ? parseFloat(hours) : null,
          amount: parseFloat(amount),
          description
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add manual entry');
      }

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[#173a7a] via-[#224fa6] to-[#3270e9] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md text-xl">✍️</span>
            <div>
              <h3 className="font-bold text-lg">Manual Wage Adjustment</h3>
              <p className="text-xs text-blue-100">Add overtime, bonus, holiday pay, or shift hours adjustment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Staff Member */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Staff Member *
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="">-- Choose Staff Member --</option>
              {staffList.map((s) => {
                const id = s?.id || s?.user?.id;
                const name = s?.name || s?.user?.name || 
                  (s?.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : 
                  (s?.user?.firstName ? `${s.user.firstName} ${s.user.lastName || ''}`.trim() : `Staff #${id}`));
                const role = (typeof s?.role === 'string' ? s.role : s?.role?.displayName || s?.role?.name) ||
                             (typeof s?.user?.role === 'string' ? s.user.role : s?.user?.role?.displayName || s?.user?.role?.name) ||
                             'Staff';
                return (
                  <option key={id} value={id}>
                    {name} ({role})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date & Entry Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Effective Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Adjustment Type *
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              >
                <option value="HOURS_ADJUSTMENT">Hours Worked Adjustment</option>
                <option value="OVERTIME">Overtime Pay</option>
                <option value="BONUS">Discretionary Bonus</option>
                <option value="HOLIDAY_PAY">Holiday Pay</option>
                <option value="MILEAGE">Mileage Allowance</option>
                <option value="EXPENSE">Expense Reimbursement</option>
                <option value="DEDUCTION">Wage Deduction (-)</option>
              </select>
            </div>
          </div>

          {/* Hours & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Additional Hours (Optional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="e.g. 4.5"
                  value={hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Adjustment Amount (£) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">£</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Reason / Explanation *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Shift overrun due to hospital escort, approved overtime..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>

          {/* Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>Management Notice:</strong> Manual entries appear on the staff member's wage breakdown with management audit details.
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Apply Wage Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
