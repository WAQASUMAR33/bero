'use client';

import { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  PlusCircle, 
  Send, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Printer, 
  User, 
  FileText 
} from 'lucide-react';
import WageManualEntryModal from './WageManualEntryModal';
import RequestWageAmendmentModal from './RequestWageAmendmentModal';

export default function StaffWageSheetView({ wageSheet, isManager = false, onDataChanged }) {
  const [activeTab, setActiveTab] = useState('timesheet'); // 'timesheet' | 'adjustments' | 'amendments'
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!wageSheet) return null;

  const { user, summary, detailedShifts = [], manualEntries = [], amendmentRequests = [] } = wageSheet;

  const handleDeleteManual = async (id) => {
    if (!confirm('Are you sure you want to remove this wage adjustment?')) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/wages/manual?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        if (onDataChanged) onDataChanged();
      } else {
        alert(data.error || 'Failed to remove entry');
      }
    } catch (err) {
      console.error(err);
      alert('Network error removing adjustment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReviewAmendment = async (id, status) => {
    const managerNotes = prompt(`Enter optional manager notes for ${status.toLowerCase()} request:`) || '';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wages/amendments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, status, managerNotes })
      });
      const data = await res.json();
      if (data.success) {
        if (onDataChanged) onDataChanged();
      } else {
        alert(data.error || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating request');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Staff Header & Wage Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#173a7a] to-[#224fa6] text-white flex items-center justify-center text-xl font-bold shadow-md">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#173a7a] text-xs font-bold border border-blue-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Employee ID: <strong>{user.employeeNumber}</strong></span>
                <span>•</span>
                <span>Base Rate: <strong>£{user.rateOfPay.toFixed(2)}/hr</strong></span>
                <span>•</span>
                <span>Contracted: <strong>{user.contractedHours} hrs/wk</strong></span>
                <span>•</span>
                <span>Sleeping Night: <strong>£{user.costForSleepingNights.toFixed(2)}/shift</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            {isManager ? (
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Manual Adjustment</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAmendmentModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#224fa6] hover:bg-[#1a3d82] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Amendment</span>
              </button>
            )}
          </div>
        </div>

        {/* Permissions notice banner for non-managers */}
        {!isManager && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span><strong>Staff View (Read-Only):</strong> You can review your clock-in hours, rates, and breakdown. To request corrections or missed hours, click "Request Amendment".</span>
            </div>
            <button
              onClick={() => setShowAmendmentModal(true)}
              className="shrink-0 px-3 py-1 bg-[#224fa6] text-white text-[11px] font-bold rounded-lg hover:bg-[#173a7a] transition-colors cursor-pointer"
            >
              Request Fix
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Regular Hours</span>
            <p className="text-lg font-black text-gray-900 mt-1">{summary.regularHours}h</p>
            <p className="text-[11px] text-gray-500">£{summary.regularPay.toFixed(2)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Standby Hours</span>
            <p className="text-lg font-black text-gray-900 mt-1">{summary.standbyHours}h</p>
            <p className="text-[11px] text-gray-500">£{summary.standbyPay.toFixed(2)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sleeping Nights</span>
            <p className="text-lg font-black text-gray-900 mt-1">{summary.sleepingNightShifts}</p>
            <p className="text-[11px] text-gray-500">£{summary.sleepingNightPay.toFixed(2)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Hours</span>
            <p className="text-lg font-black text-blue-700 mt-1">{summary.totalHours}h</p>
            <p className="text-[11px] text-gray-500">Clocked in</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Manual Adj.</span>
            <p className={`text-lg font-black mt-1 ${summary.manualAdjustmentsTotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {summary.manualAdjustmentsTotal >= 0 ? '+' : ''}£{summary.manualAdjustmentsTotal.toFixed(2)}
            </p>
            <p className="text-[11px] text-gray-500">{manualEntries.length} entries</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 text-white shadow-xs">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Gross Pay</span>
            <p className="text-xl font-black mt-1">£{summary.grossPay.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-100">Pay Period Total</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('timesheet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'timesheet'
              ? 'bg-[#224fa6] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Clock In/Out Timesheet ({detailedShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'adjustments'
              ? 'bg-[#224fa6] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Manual Adjustments & Bonuses ({manualEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('amendments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'amendments'
              ? 'bg-[#224fa6] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Amendment Requests ({amendmentRequests.length})</span>
          {amendmentRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 1. Timesheet Tab */}
      {activeTab === 'timesheet' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">
              Clock-In System Data ({detailedShifts.length} Shifts)
            </h4>
            <span className="text-xs text-gray-500 font-medium">Pulled automatically from mobile & terminal clock-in</span>
          </div>

          {detailedShifts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No clock-in records logged for this staff member in the selected pay period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <th className="py-2.5 px-4">Shift Date</th>
                    <th className="py-2.5 px-4">Work Type</th>
                    <th className="py-2.5 px-4">Clock In</th>
                    <th className="py-2.5 px-4">Clock Out</th>
                    <th className="py-2.5 px-4 text-center">Duration</th>
                    <th className="py-2.5 px-4">Service User / Location</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {detailedShifts.map((shift) => {
                    const shiftDate = new Date(shift.date);
                    const clockIn = shift.clockInTime ? new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                    const clockOut = shift.clockOutTime ? new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

                    return (
                      <tr key={shift.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                          {shiftDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            shift.workType === 'STANDBY' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-[#173a7a] border border-blue-200'
                          }`}>
                            {shift.workType}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-700">{clockIn}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-700">{clockOut}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap font-black text-gray-900">
                          {shift.durationHours} hrs
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {shift.serviceUser || 'Assigned Property'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {shift.isLate ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold">Late In</span>
                          ) : shift.isEarly ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">Early Out</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">On Time</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Manual Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">
              Manual Adjustments, Bonuses & Expenses ({manualEntries.length})
            </h4>
            {isManager && (
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#224fa6] text-white rounded-xl text-xs font-bold hover:bg-[#1a3d82] transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Entry</span>
              </button>
            )}
          </div>

          {manualEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No manual adjustments recorded for this staff member in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Adjustment Type</th>
                    <th className="py-2.5 px-4">Hours</th>
                    <th className="py-2.5 px-4">Description / Reason</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    {isManager && <th className="py-2.5 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {manualEntries.map((me) => {
                    const isDeduction = me.entryType === 'DEDUCTION';
                    return (
                      <tr key={me.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                          {new Date(me.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#173a7a] border border-blue-200">
                            {me.entryType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {me.hours ? `${me.hours} hrs` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {me.description}
                        </td>
                        <td className={`py-3 px-4 text-right whitespace-nowrap font-black text-sm ${isDeduction ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isDeduction ? '-' : '+'}£{me.amount.toFixed(2)}
                        </td>
                        {isManager && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteManual(me.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete adjustment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Amendment Requests Tab */}
      {activeTab === 'amendments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                Staff Amendment Requests ({amendmentRequests.length})
              </h4>
              <p className="text-[11px] text-gray-500">Staff-initiated corrections for missed or amended shift hours</p>
            </div>
            {!isManager && (
              <button
                onClick={() => setShowAmendmentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#224fa6] text-white rounded-xl text-xs font-bold hover:bg-[#1a3d82] transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Request Amendment</span>
              </button>
            )}
          </div>

          {amendmentRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No amendment requests logged for this staff member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <th className="py-2.5 px-4">Request Date</th>
                    <th className="py-2.5 px-4">Shift Date</th>
                    <th className="py-2.5 px-4">Requested Hours/Amount</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    {isManager && <th className="py-2.5 px-4 text-right">Manager Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {amendmentRequests.map((req) => {
                    const reqDate = new Date(req.createdAt).toLocaleDateString('en-GB');
                    const shiftDate = req.shiftDate ? new Date(req.shiftDate).toLocaleDateString('en-GB') : '-';

                    return (
                      <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-gray-600">{reqDate}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">{shiftDate}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.requestedHours ? <span>{req.requestedHours} hrs</span> : ''}
                          {req.requestedAmount ? <span className="ml-1 font-bold text-emerald-700">(£{req.requestedAmount.toFixed(2)})</span> : ''}
                          {!req.requestedHours && !req.requestedAmount && '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <p className="font-medium">{req.reason}</p>
                          {req.managerNotes && (
                            <p className="text-[10px] text-gray-500 mt-0.5">Manager response: {req.managerNotes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                              : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        {isManager && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleReviewAmendment(req.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewAmendment(req.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Modal */}
      <WageManualEntryModal
        isOpen={showManualModal}
        initialUserId={user.id}
        staffList={[{ id: user.id, name: user.name, rateOfPay: user.rateOfPay }]}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => {
          if (onDataChanged) onDataChanged();
        }}
      />

      {/* Request Amendment Modal */}
      <RequestWageAmendmentModal
        isOpen={showAmendmentModal}
        onClose={() => setShowAmendmentModal(false)}
        onSuccess={() => {
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
}
