'use client';

export default function StoolTaskView({ task }) {
  const getStoolTypeDisplay = (type) => {
    const typeMap = {
      'SEPARATED_HARD_LUMPS_HARD_TO_PASS': 'Separated Hard Lumps - Hard to Pass',
      'SAUSAGE_SHAPED_BUT_LUMPY': 'Sausage Shaped but Lumpy',
      'SAUSAGE_BUT_CRACK_ON_SURFACE': 'Sausage but Crack on Surface',
      'SOFT_BLOBS_WITH_CLEAR_CUT_EDGES': 'Soft Blobs with Clear Cut Edges',
      'FLUFFY_PIECES_WITH_RAGGED_EDGES_MUSHY': 'Fluffy Pieces with Ragged Edges, Mushy',
      'WATERY_NO_SOLID_PIECES_ENTIRELY_LIQUID': 'Watery, No Solid Pieces - Entirely Liquid',
      'NO_STOOL_PASSED': 'No Stool Passed',
      'STOMA_NO_ALERT_WILL_BE_SENT': 'Stoma - No Alert Will Be Sent',
      'UNKNOWN': 'Unknown'
    };
    return typeMap[type] || type;
  };

  const getUrineIcon = (urine) => {
    if (urine === 'YES') return '✅';
    if (urine === 'NO') return '❌';
    if (urine === 'NA') return '➖';
    return '❓';
  };

  const getCompletionBadge = (completion) => {
    if (completion === 'YES') return { color: 'bg-green-100 text-green-700', text: '✅ Yes' };
    if (completion === 'NO') return { color: 'bg-red-100 text-red-700', text: '❌ No' };
    if (completion === 'DECLINED') return { color: 'bg-orange-100 text-orange-700', text: '🚫 Declined' };
    return { color: 'bg-gray-100 text-gray-700', text: completion };
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date & Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(task.date).toLocaleDateString()} at {task.time}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Urine Passed</p>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getUrineIcon(task.urinePassed)}</span>
              <span className="text-base font-semibold text-gray-900">{task.urinePassed === 'NA' ? 'N/A' : task.urinePassed}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${getCompletionBadge(task.completed).color}`}>
              {getCompletionBadge(task.completed).text}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Stool Type</p>
            <p className="text-base font-semibold text-gray-900">{getStoolTypeDisplay(task.type)}</p>
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

