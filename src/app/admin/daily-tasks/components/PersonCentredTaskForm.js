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
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Service User */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service User *
        </label>
        <select
          value={formData.serviceSeekerId}
          onChange={(e) => setFormData({ ...formData, serviceSeekerId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Service User</option>
          {serviceSeekers.map(seeker => (
            <option key={seeker.id} value={seeker.id}>
              {seeker.firstName} {seeker.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Task Name */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Task Name *
          </label>
          <button
            type="button"
            onClick={() => onManageTaskNames()}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage Names
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={formData.nameId}
            onChange={(e) => setFormData({ ...formData, nameId: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isAddingTaskName ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              // For now, just store the file name
              // TODO: Implement cloud upload
              setFormData({ ...formData, photoUrl: file.name });
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">Cloud upload will be implemented later</p>
      </div>

      {/* Completed Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Completed Status *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' },
            { value: 'ATTEMPTED', label: '🔄 Attempted' },
            { value: 'NOT_REQUIRED', label: '⊘ Not Required' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, completed: option.value })}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                formData.completed === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter any additional notes..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Emotion */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emotion *
        </label>
        <div className="flex flex-wrap gap-2">
          {['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'CALM', 'NEUTRAL'].map(emotion => (
            <button
              key={emotion}
              type="button"
              onClick={() => setFormData({ ...formData, emotion })}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.emotion === emotion
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {emotion === 'HAPPY' && '😊 Happy'}
              {emotion === 'SAD' && '😢 Sad'}
              {emotion === 'ANGRY' && '😠 Angry'}
              {emotion === 'ANXIOUS' && '😰 Anxious'}
              {emotion === 'CALM' && '😌 Calm'}
              {emotion === 'NEUTRAL' && '😐 Neutral'}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            formData.id ? 'Update Task' : 'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}

