'use client';

export default function MedicinePrnTaskView({ task }) {
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
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Apply Date & Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(task.applyDate).toLocaleDateString()} at {task.applyTime}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">PRN</p>
            <p className="text-base font-semibold text-gray-900">{task.prn}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Medicine Name</p>
            <p className="text-base font-semibold text-gray-900">{task.medicineName}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Medicine Type</p>
            <p className="text-base font-semibold text-gray-900">{task.medicineType?.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Administrated</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${task.administrated === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {task.administrated}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Signoff Required</p>
            <p className="text-base font-semibold text-gray-900">{task.requestSignoffBy === 'REQUIRED' ? 'Required' : 'Not Needed'}</p>
          </div>

          {task.requestSignoffBy === 'REQUIRED' && task.signoffByStaff && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Signoff By</p>
              <p className="text-base font-semibold text-gray-900">{task.signoffByStaff?.firstName} {task.signoffByStaff?.lastName}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <p className="text-base font-semibold text-gray-900">{task.completed}</p>
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

      {/* Notes - Full Width */}
      {task.notes && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Notes</p>
          <p className="text-sm text-gray-900">{task.notes}</p>
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
