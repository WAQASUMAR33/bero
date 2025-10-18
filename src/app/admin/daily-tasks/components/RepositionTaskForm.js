'use client';

export default function RepositionTaskForm({ 
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

      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
        <select
          required
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Position</option>
          <option value="SELF_ASSISTED">Self Assisted</option>
          <option value="LEFT">Left</option>
          <option value="RIGHT">Right</option>
          <option value="BACK">Back</option>
          <option value="WHEELCHAIR">Wheelchair</option>
          <option value="ARM">Arm</option>
          <option value="HOISTED">Hoisted</option>
          <option value="SITTING_STRAIGHT_UP">Sitting Straight Up</option>
          <option value="WHEELCHAIR_PRESSURE_CUSHION">Wheelchair Pressure Cushion</option>
          <option value="TOILETED">Toileted</option>
          <option value="HOSPITAL_BED">Hospital Bed</option>
          <option value="ROUNDS">Rounds</option>
        </select>
      </div>

      {/* Intact or EPUAP Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Intact or EPUAP Grade *</label>
        <select
          required
          value={formData.intactOrEpuapGrade}
          onChange={(e) => setFormData({ ...formData, intactOrEpuapGrade: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Grade</option>
          <option value="INTACT">Intact</option>
          <option value="GRADE_1">Grade 1</option>
          <option value="GRADE_2">Grade 2</option>
          <option value="GRADE_3">Grade 3</option>
          <option value="GRADE_4">Grade 4</option>
        </select>
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
  );
}

