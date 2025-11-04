'use client';

import { useEffect, useState } from 'react';

export default function BathingForm({ serviceSeekerId, onNotification }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [instructions, setInstructions] = useState({ showerGelSoapShampoo: '', directions: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDefaultTimesModal, setShowDefaultTimesModal] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [showBathTypesModal, setShowBathTypesModal] = useState(false);
  const [defaultTimes, setDefaultTimes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTimeData, setNewTimeData] = useState({ day: '', hour: '', minute: '' });
  const [formData, setFormData] = useState({
    bathingType: '',
    frequency: '',
    team: 'All',
    times: [],
  });
  const [timeInputs, setTimeInputs] = useState([{ day: '', hour: '', minute: '' }]);
  const [bathTypes, setBathTypes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bathingTypes');
      return saved ? JSON.parse(saved) : ['Bath', 'Bed bath', 'Full Body Wash', 'Lower Body Wash', 'Shower', 'Strip Wash'];
    }
    return ['Bath', 'Bed bath', 'Full Body Wash', 'Lower Body Wash', 'Shower', 'Strip Wash'];
  });

  useEffect(() => {
    fetchAll();
  }, [serviceSeekerId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bathingTypes', JSON.stringify(bathTypes));
    }
  }, [bathTypes]);

  const fetchAll = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [scheduleRes, itemsRes, timesRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/bathing-schedule`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/service-seekers/${serviceSeekerId}/bathing-schedule-items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/service-seekers/${serviceSeekerId}/bathing-default-times`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setInstructions({
          showerGelSoapShampoo: data.schedule?.showerGelSoapShampoo || '',
          directions: data.schedule?.directions || '',
        });
        setTasks(data.tasks || []);
      }
      if (itemsRes.ok) setScheduleItems(await itemsRes.json());
      if (timesRes.ok) setDefaultTimes(await timesRes.json());
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
      .map((t) => `${t.day || ''} ${String(t.hour || '').padStart(2, '0')}:${String(t.minute || '').padStart(2, '0')}`)
      .filter((t) => t.trim() !== ':')
      .join(', ') || '-';
  };

  const getBathingTypeDisplay = (type) => {
    const typeMap = {
      'BATH': 'Bath',
      'BEDWASH': 'Bed bath',
      'FULL_BODY_WASH': 'Full Body Wash',
      'LOWER_BODY_WASH': 'Lower Body Wash',
      'SHOWER': 'Shower',
      'STRIP_WASH': 'Strip Wash',
    };
    return typeMap[type] || type;
  };

  const convertBathingTypeToEnum = (type) => {
    const typeMap = {
      'Bath': 'BATH',
      'Bed bath': 'BEDWASH',
      'Full Body Wash': 'FULL_BODY_WASH',
      'Lower Body Wash': 'LOWER_BODY_WASH',
      'Shower': 'SHOWER',
      'Strip Wash': 'STRIP_WASH',
    };
    return typeMap[type] || type.toUpperCase().replace(' ', '_');
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ bathingType: '', frequency: '', team: 'All', times: [] });
    setTimeInputs([{ day: '', hour: '', minute: '' }]);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      bathingType: item.bathingType || '',
      frequency: item.frequency || '',
      team: item.team || 'All',
      times: item.times || [],
    });
    if (Array.isArray(item.times) && item.times.length > 0) {
      setTimeInputs(item.times);
    } else {
      setTimeInputs([{ day: '', hour: '', minute: '' }]);
    }
    setShowModal(true);
  };

  const addTimeInput = () => {
    setTimeInputs([...timeInputs, { day: '', hour: '', minute: '' }]);
  };

  const removeTimeInput = (index) => {
    setTimeInputs(timeInputs.filter((_, i) => i !== index));
  };

  const updateTimeInput = (index, field, value) => {
    const updated = [...timeInputs];
    updated[index] = { ...updated[index], [field]: value };
    setTimeInputs(updated);
  };

  const saveScheduleItem = async () => {
    const validTimes = timeInputs
      .filter((t) => t.day && t.hour && t.minute)
      .map((t) => ({ day: t.day, hour: t.hour, minute: t.minute }));

    if (!formData.bathingType || !formData.frequency) {
      if (onNotification)
        onNotification({ show: true, message: 'Please fill required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/bathing-schedule-items`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          bathingTypeEnum: convertBathingTypeToEnum(formData.bathingType),
          times: validTimes,
          id: editingId,
          createTasks: !editingId, // Create tasks only for new items
        }),
      });
      if (res.ok) {
        await fetchAll();
        setShowModal(false);
        if (onNotification)
          onNotification({
            show: true,
            message: editingId ? 'Item updated.' : 'Item saved and tasks created.',
            type: 'success',
          });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save item.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteScheduleItem = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule item?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/service-seekers/${serviceSeekerId}/bathing-schedule-items?id=${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchAll();
        if (onNotification)
          onNotification({ show: true, message: 'Item deleted.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to delete item.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveInstructions = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/bathing-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(instructions),
      });
      if (res.ok) {
        if (onNotification)
          onNotification({ show: true, message: 'Instructions saved.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save instructions.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addDefaultTime = async () => {
    if (!newTimeData.day || !newTimeData.hour || !newTimeData.minute) {
      if (onNotification)
        onNotification({ show: true, message: 'Please fill all fields.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/bathing-default-times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTimeData),
      });
      if (res.ok) {
        await fetchAll();
        setNewTimeData({ day: '', hour: '', minute: '' });
        setShowAddTimeModal(false);
        if (onNotification)
          onNotification({ show: true, message: 'Default time added.', type: 'success' });
      } else {
        const error = await res.json();
        if (onNotification)
          onNotification({ show: true, message: error.error || 'Failed to add default time.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to add default time.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDefaultTime = async (id) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/service-seekers/${serviceSeekerId}/bathing-default-times?id=${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchAll();
        if (onNotification)
          onNotification({ show: true, message: 'Default time deleted.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to delete default time.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions = ['Daily', 'Rota Days', 'Weekly', 'Fortnightly', 'Every 3 weeks', 'Monthly', 'Quarterly', 'Yearly'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Combine schedule items and tasks for display
  const displayRows = [
    ...scheduleItems.map((item) => ({ ...item, isSchedule: true })),
    ...tasks.slice(0, 10).map((task) => ({
      id: `task-${task.id}`,
      bathingType: getBathingTypeDisplay(task.bathingType),
      frequency: formatDate(task.date),
      times: [{ day: '', hour: task.time.split(':')[0], minute: task.time.split(':')[1] }],
      team: 'All',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      isSchedule: false,
      completed: task.completed,
    })),
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="bg-orange-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Bathing</h2>
          <span className="text-white text-lg">▼</span>
          <span className="text-white text-lg">ℹ️</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Bathing Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Frequency</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Team</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">{formatTime(r.times)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.bathingType || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.frequency || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.team || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                    <td className="py-3 px-4 text-sm">
                      {r.isSchedule ? (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScheduleItem(r.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Task</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 mb-4">
            <button
              type="button"
              className="text-red-600 hover:text-red-800"
            >
              🗑️
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 text-xl"
            >
              +
            </button>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shower gel / Soap / Shampoo brands
              </label>
              <textarea
                value={instructions.showerGelSoapShampoo}
                onChange={(e) => setInstructions({ ...instructions, showerGelSoapShampoo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[100px] resize-y"
                placeholder="Enter shower gel / soap / shampoo brands"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Directions</label>
              <textarea
                value={instructions.directions}
                onChange={(e) => setInstructions({ ...instructions, directions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[100px] resize-y"
                placeholder="Enter directions"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowBathTypesModal(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              ⚙️
            </button>
            <button
              type="button"
              onClick={() => setShowDefaultTimesModal(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              ⚙️
            </button>
            <button
              type="button"
              onClick={saveInstructions}
              disabled={saving}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
            >
              Save
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white text-lg">ℹ️</span>
                <h3 className="text-xl font-semibold">
                  {editingId ? 'Edit Bathing Task' : 'New Bathing Task'}
                </h3>
              </div>
              <span className="text-white text-lg">📤</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Bathing Type:</label>
                <div className="flex-1 flex items-center space-x-2">
                  <select
                    value={formData.bathingType}
                    onChange={(e) => setFormData({ ...formData, bathingType: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Please Select</option>
                    {bathTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowBathTypesModal(true)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Frequency:</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {frequencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time:</label>
                {timeInputs.map((time, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <select
                      value={time.day}
                      onChange={(e) => updateTimeInput(idx, 'day', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Day</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
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
                  className="w-10 h-10 bg-green-600 text-white rounded flex items-center justify-center hover:bg-green-700 text-xl"
                >
                  +
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Team:</label>
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="All">All</option>
                  <option value="Team 1">Team 1</option>
                  <option value="Team 2">Team 2</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveScheduleItem}
                disabled={saving}
                className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBathTypesModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Manage Bath Types</h3>
            </div>
            <div className="p-6 space-y-2 max-h-64 overflow-y-auto">
              {bathTypes.map((type, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                  <span className="text-gray-900">{type}</span>
                  <button
                    type="button"
                    onClick={() => setBathTypes(bathTypes.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <input
                  type="text"
                  id="new-bath-type-input"
                  placeholder="Enter new bath type"
                  className="w-full border rounded-lg px-3 py-2 text-gray-900 mb-2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.target.value.trim();
                      if (val && !bathTypes.includes(val)) {
                        setBathTypes([...bathTypes, val]);
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-bath-type-input');
                    const val = input.value.trim();
                    if (val && !bathTypes.includes(val)) {
                      setBathTypes([...bathTypes, val]);
                      input.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBathTypesModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDefaultTimesModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-xl font-semibold">Default Bath Times</h3>
              <span className="text-white text-lg">📤</span>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto mb-4">
                <table className="w-full border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Day</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Modified</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultTimes.map((t, idx) => (
                      <tr key={t.id} className={`border-b ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                        <td className="py-3 px-4 text-sm text-gray-900">{t.day}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {String(t.hour).padStart(2, '0')}:{String(t.minute).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.createdAt)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.updatedAt)}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => deleteDefaultTime(t.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTimeModal(true)}
                  className="w-10 h-10 bg-green-600 text-white rounded flex items-center justify-center hover:bg-green-700 text-xl"
                >
                  +
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDefaultTimesModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTimeModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Default Bath Time</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={newTimeData.day}
                  onChange={(e) => setNewTimeData({ ...newTimeData, day: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hour</label>
                  <select
                    value={newTimeData.hour}
                    onChange={(e) => setNewTimeData({ ...newTimeData, hour: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Hour</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minute</label>
                  <select
                    value={newTimeData.minute}
                    onChange={(e) => setNewTimeData({ ...newTimeData, minute: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Minute</option>
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddTimeModal(false);
                  setNewTimeData({ day: '', hour: '', minute: '' });
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addDefaultTime}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70"
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

