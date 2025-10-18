'use client';

import { useState } from 'react';
import SignatureCanvas from './SignatureCanvas';

export default function PhysicalInterventionTaskForm({ 
  formData, 
  setFormData, 
  serviceSeekers, 
  onSubmit, 
  isSubmitting 
}) {
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  return (
    <>
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

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>

        {/* Were Other Staff Involved */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Were Other Staff Involved? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, wereOtherStaffInvolved: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.wereOtherStaffInvolved === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.wereOtherStaffInvolved === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Staff Names *</label>
            <textarea
              required={formData.wereOtherStaffInvolved === 'YES'}
              rows={2}
              value={formData.otherStaffNames || ''}
              onChange={(e) => setFormData({ ...formData, otherStaffNames: e.target.value })}
              placeholder="Mention names..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        )}

        {/* Were Other Residence Involved */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Were Other Residence Involved? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, wereOtherResidenceInvolved: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.wereOtherResidenceInvolved === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.wereOtherResidenceInvolved === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mention Names and Explain *</label>
            <textarea
              required={formData.wereOtherResidenceInvolved === 'YES'}
              rows={2}
              value={formData.otherResidenceNamesExplanation || ''}
              onChange={(e) => setFormData({ ...formData, otherResidenceNamesExplanation: e.target.value })}
              placeholder="Mention names and explain..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        )}

        {/* Were Any Injuries Sustained */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Were Any Injuries Sustained During Incident? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, wereAnyInjuriesSustained: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.wereAnyInjuriesSustained === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.wereAnyInjuriesSustained === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Explain Injuries *</label>
            <textarea
              required={formData.wereAnyInjuriesSustained === 'YES'}
              rows={2}
              value={formData.injuriesExplanation || ''}
              onChange={(e) => setFormData({ ...formData, injuriesExplanation: e.target.value })}
              placeholder="Explain injuries sustained..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        )}

        {/* Did Residence or Staff Require Medication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Did the Residence or Staff Require Medication? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, didResidenceStaffRequireMedication: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.didResidenceStaffRequireMedication === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.didResidenceStaffRequireMedication === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Explain Medication *</label>
            <textarea
              required={formData.didResidenceStaffRequireMedication === 'YES'}
              rows={2}
              value={formData.medicationExplanation || ''}
              onChange={(e) => setFormData({ ...formData, medicationExplanation: e.target.value })}
              placeholder="Explain medication required..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        )}

        {/* Has the Accident Been Filled In */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Has the Accident Been Filled In? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, hasAccidentBeenFilled: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.hasAccidentBeenFilled === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.hasAccidentBeenFilled === 'YES' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explain</label>
              <textarea
                rows={2}
                value={formData.accidentFilledExplanation || ''}
                onChange={(e) => setFormData({ ...formData, accidentFilledExplanation: e.target.value })}
                placeholder="Explain..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accident Book Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.accidentBookDateTime || ''}
                  onChange={(e) => setFormData({ ...formData, accidentBookDateTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accident Book Number</label>
                <input
                  type="text"
                  value={formData.accidentBookNumber || ''}
                  onChange={(e) => setFormData({ ...formData, accidentBookNumber: e.target.value })}
                  placeholder="Enter accident book number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                />
              </div>
            </div>
          </>
        )}

        {/* Detail of Physical Intervention */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Detail of Physical Intervention *</label>
          <textarea
            required
            rows={3}
            value={formData.detailOfPhysicalIntervention}
            onChange={(e) => setFormData({ ...formData, detailOfPhysicalIntervention: e.target.value })}
            placeholder="Enter detailed description of the physical intervention..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>

        {/* Techniques Used */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What Techniques Was Used? *</label>
          <textarea
            required
            rows={2}
            value={formData.techniquesUsed}
            onChange={(e) => setFormData({ ...formData, techniquesUsed: e.target.value })}
            placeholder="Describe techniques used..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>

        {/* Position of Staff Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What Was the Position of the Staff Members? *</label>
          <textarea
            required
            rows={2}
            value={formData.positionOfStaffMembers}
            onChange={(e) => setFormData({ ...formData, positionOfStaffMembers: e.target.value })}
            placeholder="Describe staff positions..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>

        {/* Durations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration of Physical Intervention *</label>
            <input
              type="text"
              required
              value={formData.durationOfPhysicalIntervention}
              onChange={(e) => setFormData({ ...formData, durationOfPhysicalIntervention: e.target.value })}
              placeholder="e.g., 5 minutes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration of Whole Incident *</label>
            <input
              type="text"
              required
              value={formData.durationOfWholeIncident}
              onChange={(e) => setFormData({ ...formData, durationOfWholeIncident: e.target.value })}
              placeholder="e.g., 15 minutes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            />
          </div>
        </div>

        {/* Were Restraints Used */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Were There One or More Restraints Used? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, wereRestraintsUsed: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.wereRestraintsUsed === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Was Reported to Manager */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Was This Reported to Manager? *</label>
          <div className="flex gap-3">
            {['YES', 'NO'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData({ ...formData, wasReportedToManager: option })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.wasReportedToManager === option
                    ? 'border-[#224fa6] bg-[#224fa6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#224fa6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {formData.wasReportedToManager === 'YES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explain</label>
              <textarea
                rows={2}
                value={formData.reportedToManagerExplanation || ''}
                onChange={(e) => setFormData({ ...formData, reportedToManagerExplanation: e.target.value })}
                placeholder="Explain..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Report Time</label>
              <input
                type="time"
                value={formData.managerReportTime || ''}
                onChange={(e) => setFormData({ ...formData, managerReportTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Notifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CQC Notified *</label>
            <select
              required
              value={formData.cqcNotified}
              onChange={(e) => setFormData({ ...formData, cqcNotified: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Safeguarding Notified *</label>
            <select
              required
              value={formData.safeguardingNotified}
              onChange={(e) => setFormData({ ...formData, safeguardingNotified: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Family Member Notified *</label>
            <select
              required
              value={formData.familyMemberNotified}
              onChange={(e) => setFormData({ ...formData, familyMemberNotified: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">External Professional *</label>
            <select
              required
              value={formData.externalProfessional}
              onChange={(e) => setFormData({ ...formData, externalProfessional: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
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

        {/* Add Signature Button (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Signature (Optional)</label>
          <button
            type="button"
            onClick={() => setShowSignatureModal(true)}
            className="px-6 py-2 border-2 border-[#224fa6] text-[#224fa6] rounded-lg hover:bg-blue-50 transition-all"
          >
            ✍️ {formData.signatureUrl ? 'Edit Signature' : 'Add Signature'}
          </button>
          {formData.signatureUrl && (
            <p className="mt-2 text-sm text-green-600">✓ Signature added</p>
          )}
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

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureCanvas
          onSave={(dataUrl) => {
            setFormData({ ...formData, signatureUrl: dataUrl });
            setShowSignatureModal(false);
          }}
          onClose={() => setShowSignatureModal(false)}
          existingSignature={formData.signatureUrl}
        />
      )}
    </>
  );
}

