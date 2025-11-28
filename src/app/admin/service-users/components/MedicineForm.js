'use client';

import { useEffect, useState } from 'react';

export default function MedicineForm({ serviceSeekerId, onNotification }) {
  const [medicineSchedules, setMedicineSchedules] = useState([]);
  const [prnPlans, setPrnPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showPrnModal, setShowPrnModal] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [editingPrnId, setEditingPrnId] = useState(null);
  
  // Medicine form data
  const [medicineFormData, setMedicineFormData] = useState({
    medicineName: '',
    medicineType: '',
    team: '',
    givenBy: '',
    dosage: '',
    directions: '',
    medicineWarning: '',
    startDate: '',
    endDate: '',
    frequency: 'Weekly',
    days: [],
    times: [],
  });
  
  // PRN form data
  const [prnFormData, setPrnFormData] = useState({
    medicineName: '',
    medicineType: '',
    team: '',
    directions: '',
    medicineWarning: '',
    startDate: '',
    endDate: 'Until further notice',
    givenBy: '',
    howToTake: '',
    communication: '',
    medicineDetails: '',
    maxDose24h: '',
    reasonForMedication: '',
    expectedOutcome: '',
    expectedOutcomeTimeframe: '',
    actionIfNoOutcome: '',
    whenToReferGp: '',
  });

  const [timeInputs, setTimeInputs] = useState([{ hour: '', minute: '' }]);
  const [selectedDays, setSelectedDays] = useState([]);

  const medicineTypeOptions = ['Tablet / Pill', 'Capsule', 'Liquid', 'Cream', 'Injection', 'Patch', 'Inhaler', 'Nebulizer', 'Other'];
  const teamOptions = ['All', 'Team 1', 'Team 2'];
  const dosageOptions = ['As per prescription', 'PRN (As needed)', 'Blister Pack', 'Dosset Box'];
  const frequencyOptions = ['Every 2 days', 'Every 3 days', 'Every 4 days', 'Every 5 days', 'Every 6 days', 'Weekly', 'Fortnightly', 'Every 28 days', 'Monthly', 'Rota days'];
  const givenByOptions = ['Careworker', 'CPN', 'Family', 'Hospital', 'Prompting', 'Service User'];
  const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchAll();
  }, [serviceSeekerId]);

  const fetchAll = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [schedulesRes, prnRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/medicine-schedule-items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/service-seekers/${serviceSeekerId}/medicine-prn-plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (schedulesRes.ok) setMedicineSchedules(await schedulesRes.json());
      if (prnRes.ok) setPrnPlans(await prnRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return s || '-';
    }
  };

  const formatTime = (times) => {
    if (!Array.isArray(times) || times.length === 0) return '-';
    return times
      .map((t) => `${String(t.hour || '').padStart(2, '0')}:${String(t.minute || '').padStart(2, '0')}`)
      .filter((t) => t.trim() !== ':')
      .join(', ') || '-';
  };

  const openAddMedicine = () => {
    setEditingMedicineId(null);
    setMedicineFormData({
      medicineName: '',
      medicineType: '',
      team: '',
      givenBy: '',
      dosage: '',
      directions: '',
      medicineWarning: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      frequency: 'Weekly',
      days: [],
      times: [],
    });
    setTimeInputs([{ hour: '', minute: '' }]);
    setSelectedDays([]);
    setShowMedicineModal(true);
  };

  const openEditMedicine = (item) => {
    setEditingMedicineId(item.id);
    setMedicineFormData({
      medicineName: item.medicineName || '',
      medicineType: item.medicineType || '',
      team: item.team || '',
      givenBy: item.givenBy || '',
      dosage: item.dosage || '',
      directions: item.directions || '',
      medicineWarning: item.medicineWarning || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      frequency: item.frequency || 'Weekly',
      days: Array.isArray(item.days) ? item.days : [],
      times: Array.isArray(item.times) ? item.times : [],
    });
    if (Array.isArray(item.times) && item.times.length > 0) {
      setTimeInputs(item.times);
    } else {
      setTimeInputs([{ hour: '', minute: '' }]);
    }
    setSelectedDays(Array.isArray(item.days) ? item.days : []);
    setShowMedicineModal(true);
  };

  const openAddPrn = () => {
    setEditingPrnId(null);
    setPrnFormData({
      medicineName: '',
      medicineType: '',
      team: '',
      directions: '',
      medicineWarning: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: 'Until further notice',
      givenBy: '',
      howToTake: '',
      communication: '',
      medicineDetails: '',
      maxDose24h: '',
      reasonForMedication: '',
      expectedOutcome: '',
      expectedOutcomeTimeframe: '',
      actionIfNoOutcome: '',
      whenToReferGp: '',
    });
    setShowPrnModal(true);
  };

  const openEditPrn = (item) => {
    setEditingPrnId(item.id);
    const endDateValue = !item.endDate ? 'Until further notice' : new Date(item.endDate).toISOString().split('T')[0];
    setPrnFormData({
      medicineName: item.medicineName || '',
      medicineType: item.medicineType || '',
      team: item.team || '',
      directions: item.directions || '',
      medicineWarning: item.medicineWarning || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: endDateValue,
      givenBy: item.givenBy || '',
      howToTake: item.howToTake || '',
      communication: item.communication || '',
      medicineDetails: item.medicineDetails || '',
      maxDose24h: item.maxDose24h || '',
      reasonForMedication: item.reasonForMedication || '',
      expectedOutcome: item.expectedOutcome || '',
      expectedOutcomeTimeframe: item.expectedOutcomeTimeframe || '',
      actionIfNoOutcome: item.actionIfNoOutcome || '',
      whenToReferGp: item.whenToReferGp || '',
    });
    setShowPrnModal(true);
  };

  const addTimeInput = () => {
    setTimeInputs([...timeInputs, { hour: '', minute: '' }]);
  };

  const removeTimeInput = (index) => {
    setTimeInputs(timeInputs.filter((_, i) => i !== index));
  };

  const updateTimeInput = (index, field, value) => {
    const updated = [...timeInputs];
    updated[index] = { ...updated[index], [field]: value };
    setTimeInputs(updated);
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const saveMedicine = async () => {
    const validTimes = timeInputs
      .filter((t) => t.hour && t.minute)
      .map((t) => ({ hour: String(t.hour).padStart(2, '0'), minute: String(t.minute).padStart(2, '0') }));

    if (!medicineFormData.medicineName || !medicineFormData.medicineType || !medicineFormData.team || validTimes.length === 0) {
      if (onNotification)
        onNotification({ show: true, message: 'Please fill required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/medicine-schedule-items`;
      const method = editingMedicineId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...medicineFormData,
          days: selectedDays,
          times: validTimes,
          id: editingMedicineId,
          createTasks: !editingMedicineId,
        }),
      });
      if (res.ok) {
        await fetchAll();
        setShowMedicineModal(false);
        if (onNotification)
          onNotification({
            show: true,
            message: editingMedicineId ? 'Medicine updated.' : 'Medicine saved and tasks created.',
            type: 'success',
          });
      } else {
        const error = await res.json();
        if (onNotification)
          onNotification({ show: true, message: error.error || 'Failed to save.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save medicine.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const savePrn = async () => {
    if (!prnFormData.medicineName || !prnFormData.medicineType) {
      if (onNotification)
        onNotification({ show: true, message: 'Please fill required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/medicine-prn-plans`;
      const method = editingPrnId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...prnFormData,
          endDate: prnFormData.endDate === 'Until further notice' ? null : prnFormData.endDate,
          id: editingPrnId,
        }),
      });
      if (res.ok) {
        await fetchAll();
        setShowPrnModal(false);
        if (onNotification)
          onNotification({
            show: true,
            message: editingPrnId ? 'PRN plan updated.' : 'PRN plan saved.',
            type: 'success',
          });
      } else {
        const error = await res.json();
        if (onNotification)
          onNotification({ show: true, message: error.error || 'Failed to save.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save PRN plan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicine = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/service-seekers/${serviceSeekerId}/medicine-schedule-items?id=${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchAll();
        if (onNotification)
          onNotification({ show: true, message: 'Medicine deleted.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to delete medicine.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deletePrn = async (id) => {
    if (!confirm('Are you sure you want to delete this PRN plan?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/service-seekers/${serviceSeekerId}/medicine-prn-plans?id=${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchAll();
        if (onNotification)
          onNotification({ show: true, message: 'PRN plan deleted.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to delete PRN plan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-orange-500">
      {/* Orange Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Medicine</h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <>
            {/* Medicines Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medicines</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Medicine Name</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Type</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Team</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Frequency</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Times</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineSchedules.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-4 px-5 text-sm text-gray-900 font-medium">{item.medicineName || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{item.medicineType || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{item.team || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{item.frequency || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{formatTime(item.times)}</td>
                        <td className="py-4 px-5 text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => openEditMedicine(item)}
                              className="text-[#224fa6] hover:text-[#1a3d85] font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMedicine(item.id)}
                              className="text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {medicineSchedules.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">No medicines added yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={openAddMedicine}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
              >
                + Add Medicine
              </button>
            </div>

            {/* PRN Plans Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">PRN Plans</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Medicine Name</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Type</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Team</th>
                      <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prnPlans.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-4 px-5 text-sm text-gray-900 font-medium">{item.medicineName || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{item.medicineType || '-'}</td>
                        <td className="py-4 px-5 text-sm text-gray-900">{item.team || '-'}</td>
                        <td className="py-4 px-5 text-sm">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => openEditPrn(item)}
                              className="text-[#224fa6] hover:text-[#1a3d85] font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePrn(item.id)}
                              className="text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {prnPlans.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500">No PRN plans added yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={openAddPrn}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
              >
                + Add PRN
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Medicines</h3>
                <button
                  type="button"
                  onClick={() => setShowMedicineModal(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                <input
                  type="text"
                  value={medicineFormData.medicineName}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, medicineName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={medicineFormData.medicineType}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, medicineType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {medicineTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <select
                  value={medicineFormData.team}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, team: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Given by</label>
                <select
                  value={medicineFormData.givenBy}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, givenBy: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {givenByOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                <select
                  value={medicineFormData.dosage}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, dosage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {dosageOptions.map((dosage) => (
                    <option key={dosage} value={dosage}>{dosage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Directions</label>
                <textarea
                  value={medicineFormData.directions}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, directions: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter directions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Warning</label>
                <textarea
                  value={medicineFormData.medicineWarning}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, medicineWarning: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter medicine warning"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starts On</label>
                  <input
                    type="date"
                    value={medicineFormData.startDate}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ends On</label>
                  <input
                    type="date"
                    value={medicineFormData.endDate}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={medicineFormData.frequency}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, frequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  {frequencyOptions.map((freq) => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                <div className="flex flex-wrap gap-2">
                  {daysOptions.map((day) => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Times</label>
                {timeInputs.map((time, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <select
                      value={time.hour}
                      onChange={(e) => updateTimeInput(idx, 'hour', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Hour</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={String(i).padStart(2, '0')}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-700">:</span>
                    <select
                      value={time.minute}
                      onChange={(e) => updateTimeInput(idx, 'minute', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Minute</option>
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={String(i).padStart(2, '0')}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    {timeInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeInput(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeInput}
                  className="text-orange-600 hover:text-orange-800 text-sm mt-2"
                >
                  + Add Time
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowMedicineModal(false)}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMedicine}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add PRN Modal */}
      {showPrnModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add PRN</h3>
                <button
                  type="button"
                  onClick={() => setShowPrnModal(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                <input
                  type="text"
                  value={prnFormData.medicineName}
                  onChange={(e) => setPrnFormData({ ...prnFormData, medicineName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={prnFormData.medicineType}
                  onChange={(e) => setPrnFormData({ ...prnFormData, medicineType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {medicineTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <select
                  value={prnFormData.team}
                  onChange={(e) => setPrnFormData({ ...prnFormData, team: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Directions</label>
                <textarea
                  value={prnFormData.directions}
                  onChange={(e) => setPrnFormData({ ...prnFormData, directions: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter directions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Warning</label>
                <textarea
                  value={prnFormData.medicineWarning}
                  onChange={(e) => setPrnFormData({ ...prnFormData, medicineWarning: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter medicine warning"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starts On</label>
                  <input
                    type="date"
                    value={prnFormData.startDate}
                    onChange={(e) => setPrnFormData({ ...prnFormData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ends On</label>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={prnFormData.endDate === 'Until further notice'}
                        onChange={() => setPrnFormData({ ...prnFormData, endDate: 'Until further notice' })}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Until further notice</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={prnFormData.endDate !== 'Until further notice'}
                        onChange={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setPrnFormData({ ...prnFormData, endDate: today });
                        }}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Select Date</span>
                    </label>
                  </div>
                  {prnFormData.endDate !== 'Until further notice' && (
                    <input
                      type="date"
                      value={prnFormData.endDate || ''}
                      onChange={(e) => setPrnFormData({ ...prnFormData, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 mt-2"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Given by</label>
                <select
                  value={prnFormData.givenBy}
                  onChange={(e) => setPrnFormData({ ...prnFormData, givenBy: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {givenByOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How I like to take my medication</label>
                <textarea
                  value={prnFormData.howToTake}
                  onChange={(e) => setPrnFormData({ ...prnFormData, howToTake: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter how to take medication"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How I will communicate that I need a PRN medicine</label>
                <textarea
                  value={prnFormData.communication}
                  onChange={(e) => setPrnFormData({ ...prnFormData, communication: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter communication method"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Details</label>
                <textarea
                  value={prnFormData.medicineDetails}
                  onChange={(e) => setPrnFormData({ ...prnFormData, medicineDetails: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter medication details"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum dose in 24 h</label>
                <input
                  type="text"
                  value={prnFormData.maxDose24h}
                  onChange={(e) => setPrnFormData({ ...prnFormData, maxDose24h: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter maximum dose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for giving medication</label>
                <textarea
                  value={prnFormData.reasonForMedication}
                  onChange={(e) => setPrnFormData({ ...prnFormData, reasonForMedication: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter reason"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected outcome</label>
                <textarea
                  value={prnFormData.expectedOutcome}
                  onChange={(e) => setPrnFormData({ ...prnFormData, expectedOutcome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter expected outcome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe of expected outcome</label>
                <input
                  type="text"
                  value={prnFormData.expectedOutcomeTimeframe}
                  onChange={(e) => setPrnFormData({ ...prnFormData, expectedOutcomeTimeframe: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter timeframe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action to take if required outcome not achieved</label>
                <textarea
                  value={prnFormData.actionIfNoOutcome}
                  onChange={(e) => setPrnFormData({ ...prnFormData, actionIfNoOutcome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter action"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When to refer back to GP</label>
                <textarea
                  value={prnFormData.whenToReferGp}
                  onChange={(e) => setPrnFormData({ ...prnFormData, whenToReferGp: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter when to refer"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPrnModal(false)}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePrn}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

