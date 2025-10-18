export default function MedicinePrnTaskForm({ 
  formData, 
  setFormData, 
  serviceSeekers,
  staffUsers,
  onSubmit, 
  isSubmitting 
}) {
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

      {/* Apply Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apply Date *
          </label>
          <input
            type="date"
            value={formData.applyDate}
            onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apply Time *
          </label>
          <input
            type="time"
            value={formData.applyTime}
            onChange={(e) => setFormData({ ...formData, applyTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* PRN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PRN *
        </label>
        <input
          type="text"
          value={formData.prn}
          onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
          placeholder="Enter PRN"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Medicine Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medicine Name *
        </label>
        <input
          type="text"
          value={formData.medicineName}
          onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
          placeholder="Enter medicine name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Medicine Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medicine Type *
        </label>
        <select
          value={formData.medicineType}
          onChange={(e) => setFormData({ ...formData, medicineType: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="CREAM">💊 Cream</option>
          <option value="FLUID">💧 Fluid</option>
          <option value="INJECTION">💉 Injection</option>
          <option value="PATCH">🩹 Patch</option>
          <option value="PEG">🔌 PEG</option>
          <option value="INHALER">🌬️ Inhaler</option>
          <option value="LIQUID">💧 Liquid</option>
          <option value="SYRUP">🍯 Syrup</option>
          <option value="CAPSULE">💊 Capsule</option>
          <option value="NEBULIZER">🌫️ Nebulizer</option>
          <option value="OTHER">❓ Other</option>
        </select>
      </div>

      {/* Administrated */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Administrated *
        </label>
        <div className="flex gap-3">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, administrated: option.value })}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                formData.administrated === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request Signoff By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Request Signoff By *
        </label>
        <select
          value={formData.requestSignoffBy}
          onChange={(e) => setFormData({ ...formData, requestSignoffBy: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="NOT_NEEDED">Not Needed</option>
          <option value="REQUIRED">Required</option>
        </select>
      </div>

      {/* Staff Selection (if signoff required) */}
      {formData.requestSignoffBy === 'REQUIRED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Staff for Signoff *
          </label>
          <select
            value={formData.signoffByStaffId || ''}
            onChange={(e) => setFormData({ ...formData, signoffByStaffId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={formData.requestSignoffBy === 'REQUIRED'}
          >
            <option value="">Select Staff</option>
            {Array.isArray(staffUsers) && staffUsers.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Completed Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Completed Status *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' },
            { value: 'ATTEMPTED', label: '🔄 Attempted' }
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

