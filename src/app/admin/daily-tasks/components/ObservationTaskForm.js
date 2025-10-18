export default function ObservationTaskForm({ 
  formData, 
  setFormData, 
  serviceSeekers, 
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observation Notes *
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter detailed observation notes..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
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

