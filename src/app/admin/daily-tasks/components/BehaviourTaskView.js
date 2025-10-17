'use client';

export default function BehaviourTaskView({ data, onClose }) {
  return (
    <div className="space-y-4">
      {/* Service User */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Service User</p>
        <div className="flex items-center space-x-4">
          {data.serviceSeeker?.photoUrl ? (
            <img src={data.serviceSeeker.photoUrl} alt={`${data.serviceSeeker.firstName} ${data.serviceSeeker.lastName}`} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold text-lg border-2 border-white shadow-lg">
              {data.serviceSeeker ? `${data.serviceSeeker.firstName?.[0]}${data.serviceSeeker.lastName?.[0]}` : 'SU'}
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {data.serviceSeeker ? `${data.serviceSeeker.firstName} ${data.serviceSeeker.lastName}` : '-'}
            </p>
            {data.serviceSeeker?.preferredName && (
              <p className="text-sm text-gray-600">Preferred: {data.serviceSeeker.preferredName}</p>
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
            <p className="text-base font-semibold text-gray-900">{new Date(data.date).toLocaleDateString()} at {data.time}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Behaviour Type</p>
            <p className="text-base font-semibold text-gray-900">{data.type?.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Trigger</p>
            <p className="text-base font-semibold text-gray-900">{data.trigger?.name || '-'}</p>
            {data.trigger?.define && (
              <p className="text-xs text-gray-600 mt-1">{data.trigger.define}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Emotion</p>
            <div className="flex items-center space-x-2">
              <span className="text-3xl">
                {data.emotion === 'HAPPY' ? '😊' : data.emotion === 'SAD' ? '😢' : '😐'}
              </span>
              <span className="text-base font-semibold text-gray-900">{data.emotion}</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Antecedents</p>
            <p className="text-sm text-gray-900">{data.antecedents || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Behaviour</p>
            <p className="text-sm text-gray-900">{data.behaviour || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Consequences</p>
            <p className="text-sm text-gray-900">{data.consequences || '-'}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Care/Intervention</p>
            <p className="text-sm text-gray-900">{data.careIntervention || '-'}</p>
          </div>
        </div>
      </div>

      {/* Others Involved */}
      {data.othersInvolved && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-xs font-medium text-yellow-700 uppercase mb-1">Others Involved</p>
          <p className="text-sm text-gray-900">{data.othersInvolvedDetails || 'Yes (details not provided)'}</p>
        </div>
      )}

      {/* Audit Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Audit Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Created: </span>
            <span className="text-gray-900 font-medium">
              {new Date(data.createdAt).toLocaleString()} by {data.createdBy ? `${data.createdBy.firstName} ${data.createdBy.lastName}` : 'System'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Updated: </span>
            <span className="text-gray-900 font-medium">
              {new Date(data.updatedAt).toLocaleString()} by {data.updatedBy ? `${data.updatedBy.firstName} ${data.updatedBy.lastName}` : 'System'}
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

