'use client';

export default function ComfortCheckTaskView({ task, onClose }) {
  return (
    <div className="space-y-4">
      {/* Service User */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
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
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Comfort Checks</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.allNeedsMet ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.allNeedsMet && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">All Needs Met</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.catheterCheck ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.catheterCheck && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Catheter Check</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.incontinencePadCheck ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.incontinencePadCheck && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Incontinence Pad Check</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.personalHygiene ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.personalHygiene && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Personal Hygiene</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Additional Checks</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.repositioned ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.repositioned && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Repositioned</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.sleep ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.sleep && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Sleep</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.stomaCheck ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.stomaCheck && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Stoma Check</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.toileted ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.toileted && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Toileted</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Observations</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.stoolPassed ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.stoolPassed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Stool Passed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${task.urinePassed ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {task.urinePassed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Urine Passed</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <p className="text-base font-semibold text-gray-900">{task.completed?.replace(/_/g, ' ') || '-'}</p>
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

      <div className="flex justify-end pt-2">
        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
          Close
        </button>
      </div>
    </div>
  );
}
