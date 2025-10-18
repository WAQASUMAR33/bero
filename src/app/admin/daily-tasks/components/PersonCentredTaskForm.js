'use client';

import { useState } from 'react';

export default function PersonCentredTaskForm({ 
  formData, 
  setFormData, 
  serviceSeekers, 
  personCentredTaskNames,
  onSubmit, 
  isSubmitting,
  onAddTaskName,
  isAddingTaskName,
  onManageTaskNames
}) {
  const [showAddTaskName, setShowAddTaskName] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const handleAddTaskName = async (e) => {
    e.preventDefault();
    await onAddTaskName(newTaskName);
    setNewTaskName('');
    setShowAddTaskName(false);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Service User & Date/Time */}
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
              {serviceSeekers.map(seeker => (
                <option key={seeker.id} value={seeker.id}>
                  {seeker.firstName} {seeker.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        </div>

        {/* Task Name */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Task Name *</label>
            <button
              type="button"
              onClick={() => onManageTaskNames()}
              className="text-xs text-[#224fa6] hover:text-[#3270e9] font-medium"
            >
              Manage Names
            </button>
          </div>
          <div className="flex gap-2">
            <select
              required
              value={formData.nameId}
              onChange={(e) => setFormData({ ...formData, nameId: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="">Select Task Name</option>
              {Array.isArray(personCentredTaskNames) && personCentredTaskNames.map(name => (
                <option key={name.id} value={name.id}>
                  {name.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAddTaskName(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setFormData({ ...formData, photoUrl: file.name });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Cloud upload will be implemented later</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Enter any additional notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>

        {/* Completed Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Completed *</label>
          <div className="flex flex-wrap gap-3">
            {['YES', 'NO', 'ATTEMPTED', 'NOT_REQUIRED'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, completed: status })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.completed === status
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emotion *</label>
          <div className="flex gap-6">
            {[
              { value: 'SAD', emoji: '😢', label: 'Sad' },
              { value: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
              { value: 'HAPPY', emoji: '😊', label: 'Happy' }
            ].map(emotion => (
              <button
                key={emotion.value}
                type="button"
                onClick={() => setFormData({ ...formData, emotion: emotion.value })}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  formData.emotion === emotion.value
                    ? 'border-[#224fa6] bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-[#224fa6]'
                }`}
              >
                <span className="text-4xl mb-2">{emotion.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{emotion.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
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
            ) : formData.id ? 'Update Task' : 'Save Task'}
          </button>
        </div>
      </form>

      {/* Add Task Name Modal */}
      {showAddTaskName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Task Name</h3>
            <form onSubmit={handleAddTaskName}>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter task name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent mb-4"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTaskName(false);
                    setNewTaskName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingTaskName}
                  className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingTaskName ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Task Name'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
