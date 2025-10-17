'use client';

export default function BloodPressureTaskForm({ 
  formData, 
  setFormData, 
  serviceUsers, 
  isSubmitting, 
  onSubmit, 
  onCancel,
  editing 
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
            onChange={(e)=>setFormData({...formData, serviceSeekerId:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Service User</option>
            {serviceUsers.map(su => (
              <option key={su.id} value={su.id}>{su.firstName} {su.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input 
            type="date" 
            required 
            value={formData.date} 
            onChange={(e)=>setFormData({...formData, date:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
          <input 
            type="time" 
            required 
            value={formData.time} 
            onChange={(e)=>setFormData({...formData, time:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Blood Pressure Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Systolic Pressure (mmHg) *</label>
          <input 
            type="number" 
            required
            value={formData.systolicPressure} 
            onChange={(e)=>setFormData({...formData, systolicPressure:e.target.value})}
            placeholder="e.g., 120"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diastolic Pressure (mmHg) *</label>
          <input 
            type="number" 
            required
            value={formData.diastolicPressure} 
            onChange={(e)=>setFormData({...formData, diastolicPressure:e.target.value})}
            placeholder="e.g., 80"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea 
          rows={3}
          value={formData.notes} 
          onChange={(e)=>setFormData({...formData, notes:e.target.value})}
          placeholder="Additional notes..."
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
              onClick={()=>setFormData({...formData, completed:status})}
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
              onClick={()=>setFormData({...formData, emotion:emotion.value})}
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

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]">
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : editing ? 'Update Task' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}

