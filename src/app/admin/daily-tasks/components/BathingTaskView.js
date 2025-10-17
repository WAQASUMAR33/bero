'use client';

export default function BathingTaskView({ data, onClose }) {
  const calculateAge = (dob) => {
    if (!dob) return '-';
    try {
      const d = new Date(dob);
      const diff = Date.now() - d.getTime();
      const age = new Date(diff).getUTCFullYear() - 1970;
      return age < 0 || Number.isNaN(age) ? '-' : age;
    } catch { return '-'; }
  };

  return (
    <div className="space-y-4">
      {/* Service User - Full Width with Photo */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
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
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date & Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(data.date).toLocaleDateString()} at {data.time}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Bathing Type</p>
            <p className="text-base font-semibold text-gray-900">{data.bathingType?.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Compliance</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${data.compliance === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {data.compliance}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <p className="text-base font-semibold text-gray-900">{data.completed?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Observations</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${data.stoolPassed ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {data.stoolPassed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Stool Passed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${data.urinePassed ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {data.urinePassed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Urine Passed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded ${data.catheterChecked ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                  {data.catheterChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className="text-sm text-gray-700">Catheter Checked</span>
              </div>
            </div>
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
      </div>

      {/* Bath Notes - Full Width */}
      {data.bathNotes && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Bath Notes</p>
          <p className="text-sm text-gray-900">{data.bathNotes}</p>
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

