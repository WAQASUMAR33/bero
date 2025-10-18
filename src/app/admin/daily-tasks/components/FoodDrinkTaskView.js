'use client';

export default function FoodDrinkTaskView({ task, onClose }) {
  const getMealTimeDisplay = (mealTime) => {
    if (!mealTime) return '-';
    return mealTime.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMealPortionDisplay = (portion) => {
    if (!portion) return '-';
    const map = {
      'LEFT_EATING_MEAL': 'Left eating meal',
      'NONE': 'None',
      'QUARTER_EATEN': '1/4 eaten',
      'HALF_EATEN': '1/2 eaten',
      'THREE_QUARTER_EATEN': '3/4 eaten',
      'ALL': 'All'
    };
    return map[portion] || portion;
  };

  const getAssistanceDisplay = (assistance) => {
    if (!assistance) return '-';
    return assistance.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFoodDrinkOfferedDisplay = (offered) => {
    if (!offered) return '-';
    const map = {
      'YES': 'Yes',
      'NO_ASLEEP': 'No, asleep',
      'NO_GONE_OUT': 'No, gone out',
      'NO_NOT_WANTED': 'No, not wanted'
    };
    return map[offered] || offered;
  };

  return (
    <div className="space-y-4">
      {/* Service User */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
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
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date & Meal Time</p>
            <p className="text-base font-semibold text-gray-900">{new Date(task.date).toLocaleDateString()} - {getMealTimeDisplay(task.time)}</p>
          </div>

          {task.foodDrinkOffer && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Food/Drink Offer</p>
              <p className="text-sm text-gray-900">{task.foodDrinkOffer}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Main Meal Portion</p>
            <p className="text-base font-semibold text-gray-900">{getMealPortionDisplay(task.main)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Fluid Intake</p>
            <p className="text-base font-semibold text-gray-900">{task.fluidIntake || 0} ml</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
            <p className="text-base font-semibold text-gray-900">{task.completed?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Assistance</p>
            <p className="text-base font-semibold text-gray-900">{getAssistanceDisplay(task.assistance)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Food/Drink Offered</p>
            <p className="text-base font-semibold text-gray-900">{getFoodDrinkOfferedDisplay(task.foodDrinkOffered)}</p>
          </div>

          {task.pictureUrl && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Picture</p>
              <img src={task.pictureUrl} alt="Food/Drink" className="w-full h-32 object-cover rounded-lg mt-2" />
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

      {/* Comments - Full Width */}
      {task.comments && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Comments</p>
          <p className="text-sm text-gray-900">{task.comments}</p>
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

