'use client';

import { useState, useEffect } from 'react';

export default function CreateShiftModal({
  shift,
  serviceSeekers,
  shiftTypes,
  funders,
  shiftRuns,
  onClose,
  onSaved,
  onShiftRunCreated,
  onShiftTypeCreated
}) {
  const [formData, setFormData] = useState({
    serviceSeekerId: '',
    fromDate: '',
    untilDate: '',
    recurrence: 'DAILY',
    startTime: '',
    endTime: '',
    shiftTypeId: '',
    totalStaffRequired: 1,
    funderId: '',
    timeCritical: false,
    shiftRunId: '',
    notesForCarers: '',
    notesForManager: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShiftRunModal, setShowShiftRunModal] = useState(false);
  const [newShiftRunName, setNewShiftRunName] = useState('');
  const [newShiftRunDescription, setNewShiftRunDescription] = useState('');
  const [isCreatingShiftRun, setIsCreatingShiftRun] = useState(false);
  const [showShiftTypeModal, setShowShiftTypeModal] = useState(false);
  const [newShiftType, setNewShiftType] = useState({
    name: '',
    careerPayRegular: '',
    careerPayBankHoliday: '',
    payCalculation: 'PER_HOUR'
  });
  const [isCreatingShiftType, setIsCreatingShiftType] = useState(false);
  const [calculatedWage, setCalculatedWage] = useState(null);

  useEffect(() => {
    if (shift) {
      setFormData({
        serviceSeekerId: shift.serviceSeekerId,
        fromDate: new Date(shift.fromDate).toISOString().split('T')[0],
        untilDate: shift.untilDate ? new Date(shift.untilDate).toISOString().split('T')[0] : '',
        recurrence: shift.recurrence,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftTypeId: shift.shiftTypeId,
        totalStaffRequired: shift.totalStaffRequired,
        funderId: shift.funderId || '',
        timeCritical: shift.timeCritical,
        shiftRunId: shift.shiftRunId || '',
        notesForCarers: shift.notesForCarers || '',
        notesForManager: shift.notesForManager || ''
      });
    }
  }, [shift]);

  // Calculate wage whenever relevant fields change
  useEffect(() => {
    if (formData.shiftTypeId && formData.startTime && formData.endTime) {
      calculateWage();
    }
  }, [formData.shiftTypeId, formData.startTime, formData.endTime]);

  const calculateWage = () => {
    const shiftType = shiftTypes.find(st => st.id === formData.shiftTypeId);
    if (!shiftType || !formData.startTime || !formData.endTime) {
      setCalculatedWage(null);
      return;
    }

    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    const minutes = endMin - startMin;
    hours += minutes / 60;

    if (hours < 0) hours += 24; // Handle overnight shifts

    let regularPay, bankHolidayPay;

    if (shiftType.payCalculation === 'PER_HOUR') {
      regularPay = hours * shiftType.careerPayRegular;
      bankHolidayPay = hours * shiftType.careerPayBankHoliday;
    } else {
      regularPay = shiftType.careerPayRegular;
      bankHolidayPay = shiftType.careerPayBankHoliday;
    }

    setCalculatedWage({
      hours: hours.toFixed(2),
      regularPay: regularPay.toFixed(2),
      bankHolidayPay: bankHolidayPay.toFixed(2),
      payType: shiftType.payCalculation
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = shift ? `/api/shifts/${shift.id}` : '/api/shifts';
      const method = shift ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        funderId: formData.funderId || null,
        shiftRunId: formData.shiftRunId || null,
        untilDate: formData.untilDate || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaved();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save shift');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('Failed to save shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateShiftRun = async () => {
    if (!newShiftRunName.trim()) {
      alert('Please enter a shift run name');
      return;
    }

    setIsCreatingShiftRun(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shift-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newShiftRunName,
          description: newShiftRunDescription
        })
      });

      if (res.ok) {
        const newShiftRun = await res.json();
        setFormData({ ...formData, shiftRunId: newShiftRun.id });
        setShowShiftRunModal(false);
        setNewShiftRunName('');
        setNewShiftRunDescription('');
        onShiftRunCreated();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create shift run');
      }
    } catch (error) {
      console.error('Error creating shift run:', error);
      alert('Failed to create shift run');
    } finally {
      setIsCreatingShiftRun(false);
    }
  };

  const handleCreateShiftType = async () => {
    if (!newShiftType.name.trim() || !newShiftType.careerPayRegular || !newShiftType.careerPayBankHoliday) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreatingShiftType(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shift-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newShiftType)
      });

      if (res.ok) {
        const createdShiftType = await res.json();
        setFormData({ ...formData, shiftTypeId: createdShiftType.id });
        setShowShiftTypeModal(false);
        setNewShiftType({
          name: '',
          careerPayRegular: '',
          careerPayBankHoliday: '',
          payCalculation: 'PER_HOUR'
        });
        // Call the callback to refresh shift types without reloading the page
        if (onShiftTypeCreated) {
          onShiftTypeCreated();
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create shift type');
      }
    } catch (error) {
      console.error('Error creating shift type:', error);
      alert('Failed to create shift type');
    } finally {
      setIsCreatingShiftType(false);
    }
  };

  const handleDeleteShiftType = async (shiftTypeId) => {
    if (!confirm('Are you sure you want to delete this shift type? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/shift-types/${shiftTypeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Clear the selection if the deleted type was selected
        if (formData.shiftTypeId === shiftTypeId) {
          setFormData({ ...formData, shiftTypeId: '' });
        }
        // Refresh shift types
        if (onShiftTypeCreated) {
          onShiftTypeCreated();
        }
        alert('Shift type deleted successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete shift type');
      }
    } catch (error) {
      console.error('Error deleting shift type:', error);
      alert('Failed to delete shift type');
    }
  };

  const selectedFunder = funders.find(f => f.id === formData.funderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            {shift ? 'Edit Shift' : 'Create New Shift'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Service User & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service User *</label>
                <select
                  required
                  value={formData.serviceSeekerId}
                  onChange={(e) => setFormData({ ...formData, serviceSeekerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                >
                  <option value="">Select Service User</option>
                  {serviceSeekers.map(ss => (
                    <option key={ss.id} value={ss.id}>
                      {ss.preferredName || ss.firstName} {ss.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                <input
                  type="date"
                  required
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Until Date</label>
                <input
                  type="date"
                  value={formData.untilDate}
                  onChange={(e) => setFormData({ ...formData, untilDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence *</label>
              <select
                required
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEK">Week</option>
                <option value="TWO_WEEK">2 Weeks</option>
                <option value="THREE_WEEK">3 Weeks</option>
                <option value="FOUR_WEEK">4 Weeks</option>
                <option value="FIVE_WEEK">5 Weeks</option>
                <option value="SIX_WEEK">6 Weeks</option>
                <option value="SEVEN_WEEK">7 Weeks</option>
                <option value="EIGHT_WEEK">8 Weeks</option>
                <option value="NINE_WEEK">9 Weeks</option>
                <option value="TEN_WEEK">10 Weeks</option>
                <option value="TWO_DAY">2 Days</option>
                <option value="THREE_DAY">3 Days</option>
                <option value="FOUR_DAY">4 Days</option>
                <option value="FIVE_DAY">5 Days</option>
                <option value="SIX_DAY">6 Days</option>
              </select>
            </div>

            {/* Time & Shift Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Staff Required *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalStaffRequired}
                  onChange={(e) => setFormData({ ...formData, totalStaffRequired: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>

            {/* Shift Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type *</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    required
                    value={formData.shiftTypeId}
                    onChange={(e) => setFormData({ ...formData, shiftTypeId: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                  >
                    <option value="">Select Shift Type</option>
                    {shiftTypes.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} - £{st.careerPayRegular} ({st.payCalculation === 'PER_HOUR' ? 'per hour' : 'per shift'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowShiftTypeModal(true)}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                  >
                    + Add New
                  </button>
                </div>
                
                {/* Delete Selected Shift Type Button */}
                {formData.shiftTypeId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShiftType(formData.shiftTypeId)}
                    className="w-full px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete Selected Shift Type
                  </button>
                )}
              </div>
            </div>

            {/* Wage Calculation Display */}
            {calculatedWage && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Calculated Wage
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase mb-1">Duration</div>
                    <div className="text-2xl font-bold text-gray-900">{calculatedWage.hours}h</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase mb-1">Regular Pay</div>
                    <div className="text-2xl font-bold text-green-600">£{calculatedWage.regularPay}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase mb-1">Bank Holiday Pay</div>
                    <div className="text-2xl font-bold text-blue-600">£{calculatedWage.bankHolidayPay}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Funder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funder</label>
              <select
                value={formData.funderId}
                onChange={(e) => setFormData({ ...formData, funderId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              >
                <option value="">Select Funder (Optional)</option>
                {funders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.fundingSource} - {f.contractNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Funder Details Display */}
            {selectedFunder && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Funder Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Funding Source:</span>
                    <span className="ml-2 font-medium">{selectedFunder.fundingSource}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contract Number:</span>
                    <span className="ml-2 font-medium">{selectedFunder.contractNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Type:</span>
                    <span className="ml-2 font-medium">{selectedFunder.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="ml-2 font-medium">{selectedFunder.paymentType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Time Critical & Shift Run */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="timeCritical"
                  checked={formData.timeCritical}
                  onChange={(e) => setFormData({ ...formData, timeCritical: e.target.checked })}
                  className="w-5 h-5 text-[#224fa6] rounded focus:ring-[#224fa6]"
                />
                <label htmlFor="timeCritical" className="text-sm font-medium text-gray-700">
                  Time Critical
                </label>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={formData.shiftRunId}
                  onChange={(e) => setFormData({ ...formData, shiftRunId: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                >
                  <option value="">Select Shift Run (Optional)</option>
                  {shiftRuns.map(sr => (
                    <option key={sr.id} value={sr.id}>
                      {sr.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowShiftRunModal(true)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                >
                  + Add New
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Carers</label>
                <textarea
                  rows={3}
                  value={formData.notesForCarers}
                  onChange={(e) => setFormData({ ...formData, notesForCarers: e.target.value })}
                  placeholder="Any special instructions for carers..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Manager</label>
                <textarea
                  rows={3}
                  value={formData.notesForManager}
                  onChange={(e) => setFormData({ ...formData, notesForManager: e.target.value })}
                  placeholder="Internal notes for management..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : shift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Shift Run Modal */}
      {showShiftRunModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-semibold text-white">Add Shift Run</h3>
              <button
                onClick={() => {
                  setShowShiftRunModal(false);
                  setNewShiftRunName('');
                  setNewShiftRunDescription('');
                }}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newShiftRunName}
                  onChange={(e) => setNewShiftRunName(e.target.value)}
                  placeholder="e.g., Morning Shift Run"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={newShiftRunDescription}
                  onChange={(e) => setNewShiftRunDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftRunModal(false);
                    setNewShiftRunName('');
                    setNewShiftRunDescription('');
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateShiftRun}
                  disabled={isCreatingShiftRun}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreatingShiftRun ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Type Modal */}
      {showShiftTypeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-semibold text-white">Add Shift Type</h3>
              <button
                onClick={() => {
                  setShowShiftTypeModal(false);
                  setNewShiftType({
                    name: '',
                    careerPayRegular: '',
                    careerPayBankHoliday: '',
                    payCalculation: 'PER_HOUR'
                  });
                }}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newShiftType.name}
                  onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                  placeholder="e.g., Night Shift"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Career Pay (Regular) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newShiftType.careerPayRegular}
                  onChange={(e) => setNewShiftType({ ...newShiftType, careerPayRegular: e.target.value })}
                  placeholder="15.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Career Pay (Bank Holiday) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newShiftType.careerPayBankHoliday}
                  onChange={(e) => setNewShiftType({ ...newShiftType, careerPayBankHoliday: e.target.value })}
                  placeholder="20.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pay Calculation *</label>
                <select
                  value={newShiftType.payCalculation}
                  onChange={(e) => setNewShiftType({ ...newShiftType, payCalculation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                >
                  <option value="PER_HOUR">Per Hour</option>
                  <option value="PER_SHIFT">Per Shift</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftTypeModal(false);
                    setNewShiftType({
                      name: '',
                      careerPayRegular: '',
                      careerPayBankHoliday: '',
                      payCalculation: 'PER_HOUR'
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateShiftType}
                  disabled={isCreatingShiftType}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreatingShiftType ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

