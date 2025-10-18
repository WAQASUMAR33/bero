'use client';

export default function StoolTaskForm({ 
  formData, 
  setFormData, 
  serviceSeekers, 
  onSubmit, 
  isSubmitting 
}) {
  return (
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

      {/* Stool Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stool Type *</label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Stool Type</option>
          <option value="SEPARATED_HARD_LUMPS_HARD_TO_PASS">Separated Hard Lumps - Hard to Pass</option>
          <option value="SAUSAGE_SHAPED_BUT_LUMPY">Sausage Shaped but Lumpy</option>
          <option value="SAUSAGE_BUT_CRACK_ON_SURFACE">Sausage but Crack on Surface</option>
          <option value="SOFT_BLOBS_WITH_CLEAR_CUT_EDGES">Soft Blobs with Clear Cut Edges</option>
          <option value="FLUFFY_PIECES_WITH_RAGGED_EDGES_MUSHY">Fluffy Pieces with Ragged Edges, Mushy</option>
          <option value="WATERY_NO_SOLID_PIECES_ENTIRELY_LIQUID">Watery, No Solid Pieces - Entirely Liquid</option>
          <option value="NO_STOOL_PASSED">No Stool Passed</option>
          <option value="STOMA_NO_ALERT_WILL_BE_SENT">Stoma - No Alert Will Be Sent</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      {/* Urine Passed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Urine Passed *</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' },
            { value: 'NA', label: '➖ N/A' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, urinePassed: option.value })}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                formData.urinePassed === option.value
                  ? 'border-[#224fa6] bg-[#224fa6] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' },
            { value: 'DECLINED', label: '🚫 Declined' }
          ].map(status => (
            <button
              key={status.value}
              type="button"
              onClick={() => setFormData({ ...formData, completed: status.value })}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                formData.completed === status.value
                  ? 'border-[#224fa6] bg-[#224fa6] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {status.label}
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
  );
}

