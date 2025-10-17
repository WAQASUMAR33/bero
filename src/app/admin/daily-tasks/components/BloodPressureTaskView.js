export default function BloodPressureTaskView({ task }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getEmotionEmoji = (emotion) => {
    switch (emotion) {
      case 'HAPPY': return '😊';
      case 'SAD': return '😢';
      case 'ANXIOUS': return '😰';
      case 'CALM': return '😌';
      case 'FRUSTRATED': return '😤';
      case 'CONFUSED': return '😕';
      case 'EXCITED': return '🤩';
      case 'TIRED': return '😴';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Service User */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold mr-4">
            {task.serviceSeeker?.firstName?.charAt(0) || 'S'}{task.serviceSeeker?.lastName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {task.serviceSeeker ? `${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}` : 'Service User'}
            </h3>
            <p className="text-sm text-gray-600">Blood Pressure Task</p>
          </div>
        </div>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">DATE & TIME</label>
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(task.date)} at {formatTime(task.time)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SYSTOLIC PRESSURE</label>
            <div className="text-sm font-semibold text-gray-900">{task.systolicPressure || '-'} mmHg</div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">DIASTOLIC PRESSURE</label>
            <div className="text-sm font-semibold text-gray-900">{task.diastolicPressure || '-'} mmHg</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">BLOOD PRESSURE READING</label>
            <div className="text-lg font-bold text-gray-900">
              {task.systolicPressure && task.diastolicPressure ? 
                `${task.systolicPressure}/${task.diastolicPressure} mmHg` : '-'
              }
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">COMPLETED</label>
            <div className="text-sm font-semibold text-gray-900">{task.completed?.replace(/_/g, ' ') || '-'}</div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">EMOTION</label>
            <div className="text-sm font-semibold text-gray-900 flex items-center">
              <span className="mr-2">{getEmotionEmoji(task.emotion)}</span>
              {task.emotion?.replace(/_/g, ' ') || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {task.notes && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">NOTES</label>
          <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
            {task.notes}
          </div>
        </div>
      )}

      {/* Audit Information */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">AUDIT INFORMATION</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatDate(task.createdAt)} by {task.createdBy?.firstName || 'System'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Updated:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatDate(task.updatedAt)} by {task.updatedBy?.firstName || 'System'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
