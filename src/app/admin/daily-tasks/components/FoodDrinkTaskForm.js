'use client';

export default function FoodDrinkTaskForm({ formData, setFormData, serviceUsers, isSubmitting, onSubmit, onCancel, editing }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service User */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service User *</label>
        <select
          name="serviceSeekerId"
          value={formData.serviceSeekerId}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="">Select Service User</option>
          {serviceUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Date and Meal Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Time *</label>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="TEA">Tea</option>
            <option value="MORNING_SNACK">Morning Snack</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="EVENING_SNACK">Evening Snack</option>
            <option value="AFTERNOON_SNACK">Afternoon Snack</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Food/Drink Offer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Food/Drink Offer</label>
        <input
          type="text"
          name="foodDrinkOffer"
          value={formData.foodDrinkOffer}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="What was offered?"
        />
      </div>

      {/* Main Meal Portion and Fluid Intake */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Meal Portion *</label>
          <select
            name="main"
            value={formData.main}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="LEFT_EATING_MEAL">Left eating meal</option>
            <option value="NONE">None</option>
            <option value="QUARTER_EATEN">1/4 eaten</option>
            <option value="HALF_EATEN">1/2 eaten</option>
            <option value="THREE_QUARTER_EATEN">3/4 eaten</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fluid Intake (ml) *</label>
          <select
            name="fluidIntake"
            value={formData.fluidIntake}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="0">None</option>
            {[...Array(300)].map((_, i) => {
              const ml = (i + 1) * 5;
              return <option key={ml} value={ml}>{ml}ml</option>;
            })}
          </select>
        </div>
      </div>

      {/* Assistance and Food/Drink Offered */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assistance *</label>
          <select
            name="assistance"
            value={formData.assistance}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="REQUIRED">Required</option>
            <option value="SELF_REQUIRED">Self Required</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Food/Drink Offered *</label>
          <select
            name="foodDrinkOffered"
            value={formData.foodDrinkOffered}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="YES">Yes</option>
            <option value="NO_ASLEEP">No, asleep</option>
            <option value="NO_GONE_OUT">No, gone out</option>
            <option value="NO_NOT_WANTED">No, not wanted</option>
          </select>
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          rows={3}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Additional comments..."
        />
      </div>

      {/* Picture URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Picture Upload</label>
        <input
          type="text"
          name="pictureUrl"
          value={formData.pictureUrl}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          placeholder="Picture URL (will be replaced with upload functionality)"
        />
        <p className="text-xs text-gray-500 mt-1">Note: Cloud upload functionality will be added later</p>
      </div>

      {/* Completed and Emotion */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Completed *</label>
          <select
            name="completed"
            value={formData.completed}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="NOT_REQUIRED">Not Required</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emotion *</label>
          <select
            name="emotion"
            value={formData.emotion}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="NEUTRAL">😐 Neutral</option>
            <option value="HAPPY">😊 Happy</option>
            <option value="SAD">😢 Sad</option>
            <option value="ANXIOUS">😰 Anxious</option>
            <option value="CALM">😌 Calm</option>
            <option value="FRUSTRATED">😤 Frustrated</option>
            <option value="CONFUSED">😕 Confused</option>
            <option value="EXCITED">🤩 Excited</option>
            <option value="TIRED">😴 Tired</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {isSubmitting ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

