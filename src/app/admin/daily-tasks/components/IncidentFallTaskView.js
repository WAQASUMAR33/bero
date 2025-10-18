'use client';

export default function IncidentFallTaskView({ task, onClose }) {
  const getContactsDisplay = (contact) => {
    const map = {
      'NO_ONE': 'No One',
      'AMBULANCE': 'Ambulance',
      'ONE_ONE_ONE_CALLED': '111 Called',
      'ADULT_TRANSITION_TEAM': 'Adult Transition Team (18-25)',
      'CHIROPODIST': 'Chiropodist',
      'CLINICAL_NAVIGATION': 'Clinical Navigation',
      'CLINICAL_PSYCHOLOGIST': 'Clinical Psychologist',
      'DISTRICT_NURSE': 'District Nurse',
      'DOLS': 'DoLS',
      'ENRICH_TEAM': 'Enrich Team',
      'FCPA': 'FCPA',
      'GP': 'GP',
      'MANAGER': 'Manager',
      'PARAMEDIC': 'Paramedic',
      'PHARMACIST': 'Pharmacist',
      'SALT': 'SALT',
      'SOCIAL_WORKER': 'Social Worker',
      'SPA': 'SPA',
      'TEAM_MANAGER': 'Team Manager'
    };
    return map[contact] || contact;
  };

  return (
    <div className="space-y-4">
      {/* Service User */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
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
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date & Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(task.date).toLocaleDateString()} at {task.time}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Incident Type</p>
            <p className="text-base font-semibold text-gray-900">{task.incidentType?.type || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Incident Lasted</p>
            <p className="text-base font-semibold text-gray-900">{task.incidentLasted}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Location</p>
            <p className="text-base font-semibold text-gray-900">{task.location?.name || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Service User Injured</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${
              task.serviceUserInjured === 'YES' ? 'bg-red-100 text-red-700' :
              task.serviceUserInjured === 'NO' ? 'bg-green-100 text-green-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {task.serviceUserInjured}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Witnessed By</p>
            <p className="text-base font-semibold text-gray-900">
              {task.witnessedBy === 'STAFF' && task.witnessedByStaff 
                ? `${task.witnessedByStaff.firstName} ${task.witnessedByStaff.lastName}` 
                : task.witnessedBy}
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Photo Consent</p>
            <p className="text-base font-semibold text-gray-900">{task.photoConsent}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Resident Info Provided</p>
            <p className="text-base font-semibold text-gray-900">{task.residentInfoProvided?.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Equipment Involved</p>
            <p className="text-base font-semibold text-gray-900">{task.equipmentInvolved}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Relatives Informed</p>
            <p className="text-base font-semibold text-gray-900">{task.relativesInformed?.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Contacts Called</p>
            <p className="text-base font-semibold text-gray-900">{getContactsDisplay(task.contactsCalled)}</p>
          </div>

          {task.dateReportedToSeniorStaff && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Reported to Senior Staff</p>
              <p className="text-base font-semibold text-gray-900">{new Date(task.dateReportedToSeniorStaff).toLocaleDateString()}</p>
            </div>
          )}

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

      {/* Full Width Sections */}
      {task.othersInvolved && task.othersInvolvedDetails && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-xs font-medium text-yellow-700 uppercase mb-1">Others Involved</p>
          <p className="text-sm text-gray-900">{task.othersInvolvedDetails}</p>
        </div>
      )}

      {task.injuryDetail && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Injury Detail</p>
          <p className="text-sm text-gray-900">{task.injuryDetail}</p>
        </div>
      )}

      {task.witnessDetail && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Witness Detail</p>
          <p className="text-sm text-gray-900">{task.witnessDetail}</p>
        </div>
      )}

      {task.whatResidentDoing && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">What Resident Was Doing</p>
          <p className="text-sm text-gray-900">{task.whatResidentDoing}</p>
        </div>
      )}

      {task.howIncidentHappened && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">How Incident Happened</p>
          <p className="text-sm text-gray-900">{task.howIncidentHappened}</p>
        </div>
      )}

      {task.photoUrl && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Photo</p>
          <img src={task.photoUrl} alt="Incident" className="w-full max-h-64 object-cover rounded-lg" />
        </div>
      )}

      {task.notes && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Additional Notes</p>
          <p className="text-sm text-gray-900">{task.notes}</p>
        </div>
      )}

      {task.signatureUrl && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Signature</p>
          <img src={task.signatureUrl} alt="Signature" className="h-16 object-contain" />
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

      <div className="flex justify-end pt-2">
        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
          Close
        </button>
      </div>
    </div>
  );
}

