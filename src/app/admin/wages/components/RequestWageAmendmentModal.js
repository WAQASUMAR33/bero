'use client';

import { useState } from 'react';
import { X, Send, AlertCircle, Clock, Calendar, DollarSign } from 'lucide-react';

export default function RequestWageAmendmentModal({ isOpen, onClose, onSuccess }) {
  const [shiftDate, setShiftDate] = useState('');
  const [requestedHours, setRequestedHours] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please provide an explanation for the amendment request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wages/amendments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          shiftDate: shiftDate || null,
          requestedHours: requestedHours ? parseFloat(requestedHours) : null,
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request');
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
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md text-xl">📝</span>
            <div>
              <h3 className="font-bold text-lg">Request Wage Amendment</h3>
              <p className="text-xs text-blue-100">Submit a correction or missed hours request to management</p>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Staff Notice:</strong> Staff members cannot alter wage sheets directly. Please submit your requested adjustment below and management will review it.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Shift Date (Optional)
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Requested Hours (Optional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="e.g. 2.0"
                  value={requestedHours}
                  onChange={(e) => setRequestedHours(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Requested Amount (£) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Reason / Explanation *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Clock out did not register due to network issue; finished shift at 20:30 instead of 19:30..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>

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
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Amendment Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
