export default function OneToOneTaskView({ task }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEmotionDisplay = (emotion) => {
    const emotions = {
      HAPPY: '😊 Happy',
      SAD: '😢 Sad',
      ANGRY: '😠 Angry',
      ANXIOUS: '😰 Anxious',
      CALM: '😌 Calm',
      NEUTRAL: '😐 Neutral'
    };
    return emotions[emotion] || emotion;
  };

  return (
    <div className="space-y-6">
      {/* Service User Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center overflow-hidden">
            {task.serviceSeeker?.photoUrl ? (
              <img 
                src={task.serviceSeeker.photoUrl} 
                alt={`${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-blue-700">
                {task.serviceSeeker?.firstName?.[0]}{task.serviceSeeker?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {task.serviceSeeker?.firstName} {task.serviceSeeker?.lastName}
            </h3>
            <p className="text-sm text-gray-600">Service User</p>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Date & Time */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Date
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatDate(task.date)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Time
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {task.time}
            </p>
          </div>
        </div>

        {/* Duration & Emotion */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Duration
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {task.duration}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Emotion
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {getEmotionDisplay(task.emotion)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <label className="text-xs font-medium text-amber-900 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Session Notes
        </label>
        <p className="mt-3 text-gray-800 whitespace-pre-wrap leading-relaxed">
          {task.notes || 'No notes provided'}
        </p>
      </div>

      {/* Audit Info */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Created By
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {task.createdBy?.firstName} {task.createdBy?.lastName}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(task.createdAt)} at {new Date(task.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Last Updated By
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {task.updatedBy?.firstName} {task.updatedBy?.lastName}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(task.updatedAt)} at {new Date(task.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}

