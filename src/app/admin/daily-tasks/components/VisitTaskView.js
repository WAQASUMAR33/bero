'use client';

export default function VisitTaskView({ task }) {
  const getVisitTypeIcon = (type) => {
    return type === 'FAMILY' ? '👨‍👩‍👧‍👦' : '👔';
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'ONE_ONE_ONE_VISIT': '111 Visit',
      'ATTYPD_18_25': 'ATTYPD - 18~25',
      'CHIROPODIST': 'Chiropodist',
      'CLINICAL_NAVIGATION': 'Clinical Navigation',
      'CLINICAL_PSYCHOLOGIST': 'Clinical Psychologist',
      'DISTRICT_NURSE': 'District Nurse',
      'DOLS': 'DoLS',
      'ENRICH_TEAM': 'Enrich Team',
      'FCPA': 'FCPA',
      'GP': 'GP',
      'MANAGER': 'Manager',
      'OTHER': 'Other',
      'PARAMEDIC': 'Paramedic',
      'PROBATIC_PRACTITIONER': 'Probatic Practitioner',
      'SALT': 'SALT',
      'SOCIAL_WORKER': 'Social Worker',
      'TEAM_MANAGER': 'Team Manager'
    };
    return roleMap[role] || role;
  };

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

      {/* Visit Type Badge */}
      <div className={`rounded-xl p-4 ${task.visitType === 'FAMILY' ? 'bg-gradient-to-br from-pink-50 to-pink-100' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-4xl">{getVisitTypeIcon(task.visitType)}</span>
          <p className="text-2xl font-bold text-gray-900">{task.visitType} Visit</p>
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
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Announced</p>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{task.announced === 'YES' ? '✅' : '❌'}</span>
              <span className="text-base font-semibold text-gray-900">{task.announced}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Visitor Name</p>
            <p className="text-base font-semibold text-gray-900">{task.name}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {task.visitType === 'FAMILY' && task.relationship && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Relationship</p>
              <p className="text-base font-semibold text-gray-900">{task.relationship}</p>
            </div>
          )}

          {task.visitType === 'PROFESSIONAL' && task.role && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Professional Role</p>
              <p className="text-base font-semibold text-gray-900">{getRoleDisplay(task.role)}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{task.completed === 'YES' ? '✅' : '❌'}</span>
              <span className="text-base font-semibold text-gray-900">{task.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purpose - Full Width */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Purpose</p>
        <p className="text-sm text-gray-900">{task.purpose}</p>
      </div>

      {/* Summary - Full Width */}
      {task.summary && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Summary</p>
          <p className="text-sm text-gray-900">{task.summary}</p>
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

