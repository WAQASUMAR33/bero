'use client';

import { useEffect, useState } from 'react';

export default function FoodDrinksForm({ serviceSeekerId, onNotification }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({ pegMonitoring: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    meal: '',
    directions: '',
    frequency: '',
    team: 'All',
    times: [],
  });
  const [timeInputs, setTimeInputs] = useState([{ hour: '', minute: '' }]);

  const mealOptions = ['Breakfast', 'Lunch', 'Dinner', 'Tea', 'Morning Snack', 'Afternoon Snack', 'Evening Snack', 'Other'];
  const frequencyOptions = ['Daily', 'Rota Days', 'Weekly', 'Fortnightly', 'Every 3 weeks', 'Monthly', 'Quarterly', 'Yearly'];

  useEffect(() => {
    fetchAll();
  }, [serviceSeekerId]);

  const fetchAll = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [settingsRes, itemsRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/food-drinks-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/service-seekers/${serviceSeekerId}/food-drinks-schedule-items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || { pegMonitoring: false });
        setTasks(data.tasks || []);
      }
      if (itemsRes.ok) setScheduleItems(await itemsRes.json());
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

  const getMealTimeDisplay = (time) => {
    const timeMap = {
      'BREAKFAST': 'Breakfast',
      'LUNCH': 'Lunch',
      'DINNER': 'Dinner',
      'TEA': 'Tea',
      'MORNING_SNACK': 'Morning Snack',
      'AFTERNOON_SNACK': 'Afternoon Snack',
      'EVENING_SNACK': 'Evening Snack',
      'OTHER': 'Other'
    };
    return timeMap[time] || time;
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ meal: '', directions: '', frequency: '', team: 'All', times: [] });
    setTimeInputs([{ hour: '', minute: '' }]);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      meal: item.meal || '',
      directions: item.directions || '',
      frequency: item.frequency || '',
      team: item.team || 'All',
      times: item.times || [],
    });
    if (Array.isArray(item.times) && item.times.length > 0) {
      setTimeInputs(item.times);
    } else {
      setTimeInputs([{ hour: '', minute: '' }]);
    }
    setShowModal(true);
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

  const saveScheduleItem = async () => {
    const validTimes = timeInputs
      .filter((t) => t.hour && t.minute)
      .map((t) => ({ hour: t.hour, minute: t.minute }));

    if (!formData.meal || !formData.frequency || validTimes.length === 0) {
      if (onNotification)
        onNotification({ show: true, message: 'Please fill required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/service-seekers/${serviceSeekerId}/food-drinks-schedule-items`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
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
      } else {
        const error = await res.json();
        if (onNotification)
          onNotification({ show: true, message: error.error || 'Failed to save.', type: 'error' });
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
        `/api/service-seekers/${serviceSeekerId}/food-drinks-schedule-items?id=${id}`,
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

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/food-drinks-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        if (onNotification)
          onNotification({ show: true, message: 'Settings saved.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Combine schedule items and tasks for display
  const displayRows = [
    ...scheduleItems.map((item) => ({ ...item, isSchedule: true })),
    ...tasks.slice(0, 10).map((task) => {
      const taskDate = task.date ? new Date(task.date) : new Date();
      return {
        id: `task-${task.id}`,
        meal: getMealTimeDisplay(task.time),
        directions: task.foodDrinkOffer || task.comments || '',
        frequency: formatDate(task.date),
        times: [{ hour: String(taskDate.getHours()).padStart(2, '0'), minute: String(taskDate.getMinutes()).padStart(2, '0') }],
        team: 'All',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        isSchedule: false,
        completed: task.completed,
      };
    }),
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-orange-500">
      {/* Orange Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Food/Drinks</h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Meal</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Time</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Directions</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Frequency</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Team</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Created</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Modified</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-4 px-5 text-sm text-gray-900 font-medium">{r.meal || '-'}</td>
                      <td className="py-4 px-5 text-sm text-gray-900">{formatTime(r.times)}</td>
                      <td className="py-4 px-5 text-sm text-gray-900">{r.directions || '-'}</td>
                      <td className="py-4 px-5 text-sm text-gray-900">{r.frequency || '-'}</td>
                      <td className="py-4 px-5 text-sm text-gray-900">{r.team || '-'}</td>
                      <td className="py-4 px-5 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                      <td className="py-4 px-5 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                      <td className="py-4 px-5 text-sm">
                        {r.isSchedule ? (
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="text-[#224fa6] hover:text-[#1a3d85] font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteScheduleItem(r.id)}
                              className="text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">Task</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
              <button
                type="button"
                className="text-gray-600 hover:text-red-600 transition-colors"
                title="Delete selected"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center hover:from-orange-600 hover:to-orange-700 text-2xl font-light shadow-lg hover:shadow-xl transition-all"
                title="Add new schedule item"
              >
                +
              </button>
            </div>

            <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="peg-monitoring"
                  checked={settings.pegMonitoring}
                  onChange={(e) => setSettings({ ...settings, pegMonitoring: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="peg-monitoring" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Peg Monitoring
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Orange Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {editingId ? 'Edit Food/Drinks Task' : 'New Food/Drinks Task'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Meal:</label>
                <select
                  value={formData.meal}
                  onChange={(e) => setFormData({ ...formData, meal: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {mealOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Directions/Preferences:</label>
                <textarea
                  value={formData.directions}
                  onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-h-[80px] resize-y"
                  placeholder="Enter directions or preferences"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Frequency:</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Please Select</option>
                  {frequencyOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
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
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveScheduleItem}
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

