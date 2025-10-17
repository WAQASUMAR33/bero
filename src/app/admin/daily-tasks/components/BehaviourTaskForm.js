'use client';

export default function BehaviourTaskForm({ 
  formData, 
  setFormData, 
  serviceUsers,
  behaviourTriggers,
  isSubmitting, 
  onSubmit, 
  onCancel,
  onAddTrigger,
  onManageTriggers,
  editing 
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Service User, Date, Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service User *</label>
          <select 
            required 
            value={formData.serviceSeekerId} 
            onChange={(e)=>setFormData({...formData, serviceSeekerId:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Service User</option>
            {serviceUsers.map(su => (
              <option key={su.id} value={su.id}>{su.firstName} {su.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input 
            type="date" 
            required 
            value={formData.date} 
            onChange={(e)=>setFormData({...formData, date:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
          <input 
            type="time" 
            required 
            value={formData.time} 
            onChange={(e)=>setFormData({...formData, time:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Behaviour Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Behaviour Type *</label>
        <select 
          required 
          value={formData.type} 
          onChange={(e)=>setFormData({...formData, type:e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
        >
          <option value="AGGRESSION_HITTING_BITING">Aggression (Hitting/Biting)</option>
          <option value="CRYING">Crying</option>
          <option value="HAPPY_APPRECIATING">Happy/Appreciating</option>
          <option value="ISOLATION">Isolation</option>
          <option value="SELF_INJURIOUS_BEHAVIOUR">Self Injurious Behaviour</option>
          <option value="SEXUALIZED_BEHAVIOUR_IN_PUBLIC">Sexualized Behaviour in Public</option>
          <option value="SHOUTING_SWEARING">Shouting/Swearing</option>
          <option value="SOILING_SMEARING">Soiling/Smearing</option>
          <option value="STARVATION">Starvation</option>
          <option value="THROWING_BREAKING_ITEMS">Throwing/Breaking Items</option>
        </select>
      </div>

      {/* Behaviour Trigger with Add New */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Behaviour Trigger *</label>
        <div className="flex gap-2">
          <select 
            required 
            value={formData.triggerId} 
            onChange={(e)=>setFormData({...formData, triggerId:e.target.value})}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          >
            <option value="">Select Trigger</option>
            {Array.isArray(behaviourTriggers) && behaviourTriggers.map(trigger => (
              <option key={trigger.id} value={trigger.id}>{trigger.name}</option>
            ))}
          </select>
          <button 
            type="button" 
            onClick={onAddTrigger}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 whitespace-nowrap"
          >
            + Add
          </button>
          <button 
            type="button" 
            onClick={onManageTriggers}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 whitespace-nowrap"
            title="Manage Triggers"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Others Involved */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <input 
            type="checkbox" 
            id="othersInvolved" 
            checked={formData.othersInvolved} 
            onChange={(e)=>setFormData({...formData, othersInvolved:e.target.checked})}
            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
          />
          <label htmlFor="othersInvolved" className="text-sm font-medium text-gray-700">Were others involved?</label>
        </div>
        {formData.othersInvolved && (
          <textarea 
            rows={2}
            value={formData.othersInvolvedDetails} 
            onChange={(e)=>setFormData({...formData, othersInvolvedDetails:e.target.value})}
            placeholder="Please provide names and explain..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        )}
      </div>

      {/* Text Areas: Antecedents, Behaviour, Consequences, Care/Intervention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Antecedents</label>
          <textarea 
            rows={3}
            value={formData.antecedents} 
            onChange={(e)=>setFormData({...formData, antecedents:e.target.value})}
            placeholder="What happened before the behaviour..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Behaviour</label>
          <textarea 
            rows={3}
            value={formData.behaviour} 
            onChange={(e)=>setFormData({...formData, behaviour:e.target.value})}
            placeholder="Describe the behaviour..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Consequences</label>
          <textarea 
            rows={3}
            value={formData.consequences} 
            onChange={(e)=>setFormData({...formData, consequences:e.target.value})}
            placeholder="What happened after the behaviour..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Care/Intervention</label>
          <textarea 
            rows={3}
            value={formData.careIntervention} 
            onChange={(e)=>setFormData({...formData, careIntervention:e.target.value})}
            placeholder="What care or intervention was provided..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Emotion */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Emotion *</label>
        <div className="flex gap-6">
          {[
            { value: 'SAD', emoji: '😢', label: 'Sad' },
            { value: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
            { value: 'HAPPY', emoji: '😊', label: 'Happy' }
          ].map(emotion => (
            <button
              key={emotion.value}
              type="button"
              onClick={()=>setFormData({...formData, emotion:emotion.value})}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                formData.emotion === emotion.value 
                  ? 'border-[#224fa6] bg-blue-50' 
                  : 'border-gray-300 bg-white hover:border-[#224fa6]'
              }`}
            >
              <span className="text-4xl mb-2">{emotion.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all disabled:opacity-50">
          {isSubmitting ? 'Saving...' : editing ? 'Update Task' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}

