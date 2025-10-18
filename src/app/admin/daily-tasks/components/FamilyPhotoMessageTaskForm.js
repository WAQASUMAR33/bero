'use client';

export default function FamilyPhotoMessageTaskForm({ formData, setFormData, serviceUsers, isSubmitting, onSubmit, onCancel, editing }) {
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

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Describe the photo or message..."
        />
      </div>

      {/* Message from Residence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message from Residence</label>
        <textarea
          name="messageFromResidence"
          value={formData.messageFromResidence}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Enter message from residence..."
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo Upload</label>
        <input
          type="text"
          name="photoUrl"
          value={formData.photoUrl}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Photo URL (will be replaced with upload functionality)"
        />
        <p className="text-xs text-gray-500 mt-1">Note: Cloud upload functionality will be added later</p>
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

