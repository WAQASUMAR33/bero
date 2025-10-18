'use client';

export default function IncidentFallTaskForm({ 
  formData, 
  setFormData, 
  serviceUsers,
  incidentTypes,
  incidentLocations,
  staffUsers,
  isSubmitting, 
  onSubmit, 
  onCancel,
  onManageIncidentTypes,
  onManageLocations,
  editing 
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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

      {/* Incident Type & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type *</label>
          <div className="flex gap-2">
            <select 
              required 
              value={formData.incidentTypeId} 
              onChange={(e)=>setFormData({...formData, incidentTypeId:e.target.value})}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="">Select Incident Type</option>
              {(Array.isArray(incidentTypes) ? incidentTypes : []).map(type => (
                <option key={type.id} value={type.id}>{type.type}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onManageIncidentTypes}
              className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center"
              title="Manage Incident Types"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Incident Lasted *</label>
          <input 
            type="text"
            required 
            value={formData.incidentLasted} 
            onChange={(e)=>setFormData({...formData, incidentLasted:e.target.value})}
            placeholder="e.g., 5 minutes, 30 seconds"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
        <div className="flex gap-2">
          <select 
            required 
            value={formData.locationId} 
            onChange={(e)=>setFormData({...formData, locationId:e.target.value})}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Location</option>
            {(Array.isArray(incidentLocations) ? incidentLocations : []).map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onManageLocations}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center"
            title="Manage Locations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Others Involved */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Were Other Staff Involved? *</label>
        <div className="flex gap-3 mb-2">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ].map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={()=>setFormData({...formData, othersInvolved:opt.value})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.othersInvolved === opt.value 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {formData.othersInvolved && (
          <textarea 
            rows={2}
            value={formData.othersInvolvedDetails} 
            onChange={(e)=>setFormData({...formData, othersInvolvedDetails:e.target.value})}
            placeholder="Give names and explain..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        )}
      </div>

      {/* Injury Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Injury Detail</label>
        <textarea 
          rows={2}
          value={formData.injuryDetail} 
          onChange={(e)=>setFormData({...formData, injuryDetail:e.target.value})}
          placeholder="Describe any injuries..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Service User Injured */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Service User Injured? *</label>
        <div className="flex flex-wrap gap-3">
          {['YES', 'NO', 'UNSURE'].map(status => (
            <button
              key={status}
              type="button"
              onClick={()=>setFormData({...formData, serviceUserInjured:status})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.serviceUserInjured === status 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Witnessed By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Witnessed By *</label>
        <div className="flex gap-3 mb-2">
          {['NOBODY', 'STAFF'].map(witness => (
            <button
              key={witness}
              type="button"
              onClick={()=>setFormData({...formData, witnessedBy:witness, witnessedByStaffId: witness === 'NOBODY' ? '' : formData.witnessedByStaffId})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.witnessedBy === witness 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {witness}
            </button>
          ))}
        </div>
        {formData.witnessedBy === 'STAFF' && (
          <select 
            value={formData.witnessedByStaffId} 
            onChange={(e)=>setFormData({...formData, witnessedByStaffId:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Staff Member</option>
            {(Array.isArray(staffUsers) ? staffUsers : []).map(staff => (
              <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Witness Detail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Witness Detail</label>
        <textarea 
          rows={2}
          value={formData.witnessDetail} 
          onChange={(e)=>setFormData({...formData, witnessDetail:e.target.value})}
          placeholder="Details from witness..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Photo Consent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo Consent *</label>
        <div className="flex flex-wrap gap-3">
          {['YES', 'NO', 'SPECIFIED'].map(consent => (
            <button
              key={consent}
              type="button"
              onClick={()=>setFormData({...formData, photoConsent:consent})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.photoConsent === consent 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {consent}
            </button>
          ))}
        </div>
      </div>

      {/* Photo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo Upload</label>
        <input 
          type="text"
          value={formData.photoUrl} 
          onChange={(e)=>setFormData({...formData, photoUrl:e.target.value})}
          placeholder="Photo URL (cloud upload will be added later)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Resident Info Provided */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Was Resident Able to Provide Information? *</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'YES', label: 'Yes' },
            { value: 'NO', label: 'No' },
            { value: 'NOT_RELIABLY', label: 'Not Reliably' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={()=>setFormData({...formData, residentInfoProvided:opt.value})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.residentInfoProvided === opt.value 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* What Resident Doing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">What Was Resident Doing at Time of Incident?</label>
        <textarea 
          rows={2}
          value={formData.whatResidentDoing} 
          onChange={(e)=>setFormData({...formData, whatResidentDoing:e.target.value})}
          placeholder="Describe what the resident was doing..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* How Incident Happened */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">How Did Incident Happen?</label>
        <textarea 
          rows={2}
          value={formData.howIncidentHappened} 
          onChange={(e)=>setFormData({...formData, howIncidentHappened:e.target.value})}
          placeholder="Describe how the incident occurred..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Date Reported to Senior Staff */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Reported to Senior Staff</label>
        <input 
          type="date"
          value={formData.dateReportedToSeniorStaff} 
          onChange={(e)=>setFormData({...formData, dateReportedToSeniorStaff:e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
      </div>

      {/* Equipment/Machinery Involved */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Any Equipment/Machinery Involved? *</label>
        <div className="flex gap-3">
          {['YES', 'NO'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={()=>setFormData({...formData, equipmentInvolved:opt})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.equipmentInvolved === opt 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Relatives Informed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Have Relatives Been Informed? *</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'YES', label: 'Yes' },
            { value: 'NO', label: 'No' },
            { value: 'NOT_YET', label: 'Not Yet' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={()=>setFormData({...formData, relativesInformed:opt.value})}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.relativesInformed === opt.value 
                  ? 'border-[#224fa6] bg-[#224fa6] text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Called */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">GP/Ambulance Called *</label>
        <select 
          required 
          value={formData.contactsCalled} 
          onChange={(e)=>setFormData({...formData, contactsCalled:e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="NO_ONE">No One</option>
          <option value="AMBULANCE">Ambulance</option>
          <option value="ONE_ONE_ONE_CALLED">111 Called</option>
          <option value="ADULT_TRANSITION_TEAM">Adult Transition Team (18-25)</option>
          <option value="CHIROPODIST">Chiropodist</option>
          <option value="CLINICAL_NAVIGATION">Clinical Navigation</option>
          <option value="CLINICAL_PSYCHOLOGIST">Clinical Psychologist</option>
          <option value="DISTRICT_NURSE">District Nurse</option>
          <option value="DOLS">DoLS</option>
          <option value="ENRICH_TEAM">Enrich Team</option>
          <option value="FCPA">FCPA</option>
          <option value="GP">GP</option>
          <option value="MANAGER">Manager</option>
          <option value="PARAMEDIC">Paramedic</option>
          <option value="PHARMACIST">Pharmacist</option>
          <option value="SALT">SALT</option>
          <option value="SOCIAL_WORKER">Social Worker</option>
          <option value="SPA">SPA</option>
          <option value="TEAM_MANAGER">Team Manager</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
        <textarea 
          rows={3}
          value={formData.notes} 
          onChange={(e)=>setFormData({...formData, notes:e.target.value})}
          placeholder="Any additional information..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
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

      {/* Signature (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Signature (Optional)</label>
        <input 
          type="text"
          value={formData.signatureUrl} 
          onChange={(e)=>setFormData({...formData, signatureUrl:e.target.value})}
          placeholder="Signature URL (digital signature feature will be added later)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Note: Digital signature capture will be added later</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
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

