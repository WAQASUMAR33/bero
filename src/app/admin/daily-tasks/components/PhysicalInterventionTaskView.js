'use client';

export default function PhysicalInterventionTaskView({ task }) {
  return (
    <div className="space-y-4">
      {/* Service User - Full Width with Photo */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Service User</p>
        <div className="flex items-center space-x-4">
          {task.serviceSeeker?.photoUrl ? (
            <img src={task.serviceSeeker.photoUrl} alt={`${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}`} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold text-lg border-2 border-white shadow-lg">
              {task.serviceSeeker ? `${task.serviceSeeker.firstName?.[0]}${task.serviceSeeker.lastName?.[0]}` : 'SU'}
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {task.serviceSeeker ? `${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}` : '-'}
            </p>
            {task.serviceSeeker?.preferredName && (
              <p className="text-sm text-gray-600">Preferred: {task.serviceSeeker.preferredName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date & Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(task.date).toLocaleDateString()} at {task.time}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Location</p>
            <p className="text-base font-semibold text-gray-900">{task.location}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Other Staff Involved</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.wereOtherStaffInvolved === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.wereOtherStaffInvolved}
            </span>
            {task.wereOtherStaffInvolved === 'YES' && task.otherStaffNames && (
              <p className="text-sm text-gray-700 mt-2">{task.otherStaffNames}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Other Residence Involved</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.wereOtherResidenceInvolved === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.wereOtherResidenceInvolved}
            </span>
            {task.wereOtherResidenceInvolved === 'YES' && task.otherResidenceNamesExplanation && (
              <p className="text-sm text-gray-700 mt-2">{task.otherResidenceNamesExplanation}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Injuries Sustained</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.wereAnyInjuriesSustained === 'YES' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {task.wereAnyInjuriesSustained}
            </span>
            {task.wereAnyInjuriesSustained === 'YES' && task.injuriesExplanation && (
              <p className="text-sm text-gray-700 mt-2">{task.injuriesExplanation}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Medication Required</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.didResidenceStaffRequireMedication === 'YES' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.didResidenceStaffRequireMedication}
            </span>
            {task.didResidenceStaffRequireMedication === 'YES' && task.medicationExplanation && (
              <p className="text-sm text-gray-700 mt-2">{task.medicationExplanation}</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Accident Book Filled</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.hasAccidentBeenFilled === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.hasAccidentBeenFilled}
            </span>
            {task.hasAccidentBeenFilled === 'YES' && (
              <>
                {task.accidentFilledExplanation && <p className="text-sm text-gray-700 mt-2">{task.accidentFilledExplanation}</p>}
                {task.accidentBookDateTime && <p className="text-xs text-gray-600 mt-1">Date/Time: {task.accidentBookDateTime}</p>}
                {task.accidentBookNumber && <p className="text-xs text-gray-600">Book #: {task.accidentBookNumber}</p>}
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Durations</p>
            <p className="text-sm text-gray-700">Intervention: <span className="font-semibold">{task.durationOfPhysicalIntervention}</span></p>
            <p className="text-sm text-gray-700 mt-1">Whole Incident: <span className="font-semibold">{task.durationOfWholeIncident}</span></p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Restraints Used</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.wereRestraintsUsed === 'YES' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {task.wereRestraintsUsed}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Reported to Manager</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.wasReportedToManager === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.wasReportedToManager}
            </span>
            {task.wasReportedToManager === 'YES' && (
              <>
                {task.reportedToManagerExplanation && <p className="text-sm text-gray-700 mt-2">{task.reportedToManagerExplanation}</p>}
                {task.managerReportTime && <p className="text-xs text-gray-600 mt-1">Report Time: {task.managerReportTime}</p>}
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Emotion</p>
            <div className="flex items-center space-x-2">
              <span className="text-3xl">
                {task.emotion === 'HAPPY' ? '😊' : task.emotion === 'SAD' ? '😢' : '😐'}
              </span>
              <span className="text-base font-semibold text-gray-900">{task.emotion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Details - Full Width */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Detail of Physical Intervention</p>
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.detailOfPhysicalIntervention}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Techniques Used</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.techniquesUsed}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Position of Staff Members</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.positionOfStaffMembers}</p>
        </div>
      </div>

      {/* Notifications - Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">CQC Notified</p>
          <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.cqcNotified === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {task.cqcNotified}
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Safeguarding Notified</p>
          <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.safeguardingNotified === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {task.safeguardingNotified}
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Family Notified</p>
          <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.familyMemberNotified === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {task.familyMemberNotified}
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">External Professional</p>
          <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.externalProfessional === 'YES' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {task.externalProfessional}
          </span>
        </div>
      </div>

      {/* Signature */}
      {task.signatureUrl && task.signatureUrl !== 'signature-placeholder' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Signature</p>
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <img 
              src={task.signatureUrl} 
              alt="Signature" 
              className="max-w-full h-auto"
              style={{ maxHeight: '150px' }}
            />
          </div>
        </div>
      )}
      {task.signatureUrl === 'signature-placeholder' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Signature</p>
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-500">✍️ Signature on file</p>
          </div>
        </div>
      )}

      {/* Audit Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Audit Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Created: </span>
            <span className="text-gray-900 font-medium">
              {new Date(task.createdAt).toLocaleString()} by {task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'System'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Updated: </span>
            <span className="text-gray-900 font-medium">
              {new Date(task.updatedAt).toLocaleString()} by {task.updatedBy ? `${task.updatedBy.firstName} ${task.updatedBy.lastName}` : 'System'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

