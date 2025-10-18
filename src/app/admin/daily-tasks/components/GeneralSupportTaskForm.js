'use client';

export default function GeneralSupportTaskForm({ formData, setFormData, serviceUsers, supportLists, isSubmitting, onSubmit, onCancel, editing, onManageSupportLists }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service User */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service User *</label>
        <select
          name="serviceSeekerId"
          value={formData.serviceSeekerId}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Service User</option>
          {serviceUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Support List */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Support Type *</label>
          <button
            type="button"
            onClick={onManageSupportLists}
            className="text-xs text-[#224fa6] hover:underline"
          >
            Manage Support Types
          </button>
        </div>
        <select
          name="supportListId"
          value={formData.supportListId}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Support Type</option>
          {(Array.isArray(supportLists) ? supportLists : []).map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Enter support details..."
        />
      </div>

      {/* Emotion */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Emotion *</label>
        <select
          name="emotion"
          value={formData.emotion}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="NEUTRAL">😐 Neutral</option>
          <option value="HAPPY">😊 Happy</option>
          <option value="SAD">😢 Sad</option>
          <option value="ANXIOUS">😰 Anxious</option>
          <option value="CALM">😌 Calm</option>
          <option value="FRUSTRATED">😤 Frustrated</option>
          <option value="CONFUSED">😕 Confused</option>
          <option value="EXCITED">🤩 Excited</option>
          <option value="TIRED">😴 Tired</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {isSubmitting ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

