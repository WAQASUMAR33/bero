'use client';

export default function BathingTaskForm({ 
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

      {/* Bathing Type & Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bathing Type *</label>
          <select 
            required 
            value={formData.bathingType} 
            onChange={(e)=>setFormData({...formData, bathingType:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="BATH">Bath</option>
            <option value="BEDWASH">Bed Wash</option>
            <option value="FULL_BODY_WASH">Full Body Wash</option>
            <option value="LOWER_BODY_WASH">Lower Body Wash</option>
            <option value="SHOWER">Shower</option>
            <option value="STRIP_WASH">Strip Wash</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compliance *</label>
          <select 
            required 
            value={formData.compliance} 
            onChange={(e)=>setFormData({...formData, compliance:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="COMPLETED">Completed</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      {/* Yes/No Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="stoolPassed" 
            checked={formData.stoolPassed} 
            onChange={(e)=>setFormData({...formData, stoolPassed:e.target.checked})}
            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
          />
          <label htmlFor="stoolPassed" className="text-sm font-medium text-gray-700">Stool Passed</label>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="urinePassed" 
            checked={formData.urinePassed} 
            onChange={(e)=>setFormData({...formData, urinePassed:e.target.checked})}
            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
          />
          <label htmlFor="urinePassed" className="text-sm font-medium text-gray-700">Urine Passed</label>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="catheterChecked" 
            checked={formData.catheterChecked} 
            onChange={(e)=>setFormData({...formData, catheterChecked:e.target.checked})}
            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
          />
          <label htmlFor="catheterChecked" className="text-sm font-medium text-gray-700">Catheter Checked</label>
        </div>
      </div>

      {/* Bath Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bath Notes</label>
        <textarea 
          rows={3}
          value={formData.bathNotes} 
          onChange={(e)=>setFormData({...formData, bathNotes:e.target.value})}
          placeholder="Additional notes about the bathing task..."
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
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50">
          {isSubmitting ? 'Saving...' : editing ? 'Update Task' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}

