'use client';

export default function VisitTaskForm({ 
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

      {/* Visit Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type *</label>
        <div className="flex gap-4">
          {[
            { value: 'FAMILY', label: '👨‍👩‍👧‍👦 Family' },
            { value: 'PROFESSIONAL', label: '👔 Professional' }
          ].map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, visitType: type.value, relationship: '', role: '' })}
              className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                formData.visitType === type.value
                  ? 'border-[#224fa6] bg-[#224fa6] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announced */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Announced *</label>
        <div className="flex gap-4">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' }
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, announced: option.value })}
              className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                formData.announced === option.value
                  ? 'border-[#224fa6] bg-[#224fa6] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter visitor name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Conditional Fields Based on Visit Type */}
      {formData.visitType === 'FAMILY' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
          <input
            type="text"
            value={formData.relationship || ''}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            placeholder="e.g., Mother, Brother, Friend"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      )}

      {formData.visitType === 'PROFESSIONAL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
          <select
            required={formData.visitType === 'PROFESSIONAL'}
            value={formData.role || ''}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Role</option>
            <option value="ONE_ONE_ONE_VISIT">111 Visit</option>
            <option value="ATTYPD_18_25">ATTYPD - 18~25</option>
            <option value="CHIROPODIST">Chiropodist</option>
            <option value="CLINICAL_NAVIGATION">Clinical Navigation</option>
            <option value="CLINICAL_PSYCHOLOGIST">Clinical Psychologist</option>
            <option value="DISTRICT_NURSE">District Nurse</option>
            <option value="DOLS">DoLS</option>
            <option value="ENRICH_TEAM">Enrich Team</option>
            <option value="FCPA">FCPA</option>
            <option value="GP">GP</option>
            <option value="MANAGER">Manager</option>
            <option value="OTHER">Other</option>
            <option value="PARAMEDIC">Paramedic</option>
            <option value="PROBATIC_PRACTITIONER">Probatic Practitioner</option>
            <option value="SALT">SALT</option>
            <option value="SOCIAL_WORKER">Social Worker</option>
            <option value="TEAM_MANAGER">Team Manager</option>
          </select>
        </div>
      )}

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
        <textarea
          rows={2}
          required
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="Enter the purpose of the visit..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
        <textarea
          rows={3}
          value={formData.summary || ''}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          placeholder="Enter a summary of the visit..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Completed Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Completed *</label>
        <div className="flex gap-4">
          {[
            { value: 'YES', label: '✅ Yes' },
            { value: 'NO', label: '❌ No' }
          ].map(status => (
            <button
              key={status.value}
              type="button"
              onClick={() => setFormData({ ...formData, completed: status.value })}
              className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
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

