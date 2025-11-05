'use client';

export default function CouncilForm({ council, setField, onSave, saving }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Council</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Council : Service User ID</label>
            <input
              value={council.councilServiceUserId || ''}
              onChange={e => setField('councilServiceUserId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
              placeholder="Enter Council Service User ID"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Council : Care Provider ID</label>
            <input
              value={council.councilCareProviderId || ''}
              onChange={e => setField('councilCareProviderId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
              placeholder="Enter Council Care Provider ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={council.serviceType || ''}
              onChange={e => setField('serviceType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
            >
            <option value="">Please Select</option>
            <option value="1NTC Night Time Care South">1NTC Night Time Care South</option>
            <option value="99FN Home Care Framework Hour">99FN Home Care Framework Hour</option>
            <option value="99FN Home Care Framework Hour (Non-EMS)">99FN Home Care Framework Hour (Non-EMS)</option>
            <option value="99HC Home Care Hour">99HC Home Care Hour</option>
            <option value="99XC Extra Carer Home Care Hour (Double Manned Hour)">99XC Extra Carer Home Care Hour (Double Manned Hour)</option>
            <option value="Carers Homecare Area 1">Carers Homecare Area 1</option>
            <option value="Carers Homecare Area 2">Carers Homecare Area 2</option>
            <option value="Carers Homecare Area 3">Carers Homecare Area 3</option>
            <option value="Carers Homecare Area 4">Carers Homecare Area 4</option>
            <option value="Domiciliary Support - Complex">Domiciliary Support - Complex</option>
            <option value="Domiciliary Support - Generic Domiciliary Services">Domiciliary Support - Generic Domiciliary Services</option>
            <option value="Domiciliary Support - Non-Weight Bearing Pathway">Domiciliary Support - Non-Weight Bearing Pathway</option>
            <option value="Extra Care Housing Planned Care">Extra Care Housing Planned Care</option>
            <option value="HC - Careworker">HC - Careworker</option>
            <option value="Health Domiciliary Support - Complex">Health Domiciliary Support - Complex</option>
            <option value="Health Domiciliary Support - Generic Health Domiciliary Services">Health Domiciliary Support - Generic Health Domiciliary Services</option>
            <option value="Home Care timetabled double-handed">Home Care timetabled double-handed</option>
            <option value="Home Care timetabled single-handed">Home Care timetabled single-handed</option>
            <option value="Home Support">Home Support</option>
            <option value="Homecare (LWH) - Health Funded - Single Carer">Homecare (LWH) - Health Funded - Single Carer</option>
            <option value="Homecare (LWH) - Single Carer">Homecare (LWH) - Single Carer</option>
            <option value="Homecare (LWH) - Two Carer">Homecare (LWH) - Two Carer</option>
            <option value="Homecare Area 1">Homecare Area 1</option>
            <option value="Homecare Area 2">Homecare Area 2</option>
            <option value="Homecare Area 3">Homecare Area 3</option>
            <option value="Homecare Area 4">Homecare Area 4</option>
            <option value="Homecare Extra Carer SFW">Homecare Extra Carer SFW</option>
            <option value="Homecare Personal Care SFW">Homecare Personal Care SFW</option>
            <option value="Hospital Discharge Homecare Area 1">Hospital Discharge Homecare Area 1</option>
            <option value="Hospital Discharge Homecare Area 2">Hospital Discharge Homecare Area 2</option>
            <option value="Hospital Discharge Homecare Area 3">Hospital Discharge Homecare Area 3</option>
            <option value="Hospital Discharge Homecare Area 4">Hospital Discharge Homecare Area 4</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Maintenance - 2 Carers">Maintenance - 2 Carers</option>
            <option value="Maintenance 3 Carers">Maintenance 3 Carers</option>
            <option value="Maintenance 4 Carers">Maintenance 4 Carers</option>
            <option value="Maintenance - 5 Carers">Maintenance - 5 Carers</option>
            <option value="Maintenance 5 Carers">Maintenance 5 Carers</option>
            <option value="Outreach - Support">Outreach - Support</option>
            <option value="Personal Day Hour: Timetabled-visit (Hour)">Personal Day Hour: Timetabled-visit (Hour)</option>
            <option value="Personal Wknd Hour: Timetabled-visit">Personal Wknd Hour: Timetabled-visit</option>
            <option value="Sleeping Night">Sleeping Night</option>
            <option value="Support to access the community DPS - Intermediate 2">Support to access the community DPS - Intermediate 2</option>
            <option value="Supported Living">Supported Living</option>
            <option value="Waking Night">Waking Night</option>
          </select>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Level</label>
            <select
              value={council.serviceLevel || ''}
              onChange={e => setField('serviceLevel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
            >
            <option value="">Please Select</option>
            <option value="Maintenance - 5 Carers">Maintenance - 5 Carers</option>
            <option value="Outreach - Support">Outreach - Support</option>
            <option value="Personal Day Hour: Timetabled-visit (Hour)">Personal Day Hour: Timetabled-visit (Hour)</option>
            <option value="Personal Wknd Hour: Timetabled-visit">Personal Wknd Hour: Timetabled-visit</option>
            <option value="Sleeping Night">Sleeping Night</option>
            <option value="Support to access the community DPS - Intermediate 2">Support to access the community DPS - Intermediate 2</option>
            <option value="Supported Living">Supported Living</option>
            <option value="Waking Night">Waking Night</option>
            <option value="1NTC Night Time Care South">1NTC Night Time Care South</option>
            <option value="99FN Home Care Framework Hour">99FN Home Care Framework Hour</option>
            <option value="99FN Home Care Framework Hour (Non-EMS)">99FN Home Care Framework Hour (Non-EMS)</option>
            <option value="99HC Home Care Hour">99HC Home Care Hour</option>
            <option value="99XC Extra Carer Home Care Hour (Double Manned Hour)">99XC Extra Carer Home Care Hour (Double Manned Hour)</option>
            <option value="Carers Homecare Area 1">Carers Homecare Area 1</option>
            <option value="Carers Homecare Area 2">Carers Homecare Area 2</option>
            <option value="Carers Homecare Area 3">Carers Homecare Area 3</option>
            <option value="Carers Homecare Area 4">Carers Homecare Area 4</option>
            <option value="Domiciliary Support - Complex">Domiciliary Support - Complex</option>
            <option value="Domiciliary Support - Generic Domiciliary Services">Domiciliary Support - Generic Domiciliary Services</option>
            <option value="Domiciliary Support - Non-Weight Bearing Pathway">Domiciliary Support - Non-Weight Bearing Pathway</option>
            <option value="Extra Care Housing Planned Care">Extra Care Housing Planned Care</option>
            <option value="HC - Careworker">HC - Careworker</option>
            <option value="Health Domiciliary Support - Complex">Health Domiciliary Support - Complex</option>
            <option value="Health Domiciliary Support - Generic Health Domiciliary Services">Health Domiciliary Support - Generic Health Domiciliary Services</option>
            <option value="Home Care timetabled double-handed">Home Care timetabled double-handed</option>
            <option value="Home Care timetabled single-handed">Home Care timetabled single-handed</option>
            <option value="Home Support">Home Support</option>
            <option value="Homecare (LWH) - Health Funded - Single Carer">Homecare (LWH) - Health Funded - Single Carer</option>
            <option value="Homecare (LWH) - Single Carer">Homecare (LWH) - Single Carer</option>
            <option value="Homecare (LWH) - Two Carer">Homecare (LWH) - Two Carer</option>
            <option value="Homecare Area 1">Homecare Area 1</option>
            <option value="Homecare Area 2">Homecare Area 2</option>
            <option value="Homecare Area 3">Homecare Area 3</option>
            <option value="Homecare Area 4">Homecare Area 4</option>
            <option value="Homecare Extra Carer SFW">Homecare Extra Carer SFW</option>
            <option value="Homecare Personal Care SFW">Homecare Personal Care SFW</option>
            <option value="Hospital Discharge Homecare Area 1">Hospital Discharge Homecare Area 1</option>
            <option value="Hospital Discharge Homecare Area 2">Hospital Discharge Homecare Area 2</option>
            <option value="Hospital Discharge Homecare Area 3">Hospital Discharge Homecare Area 3</option>
            <option value="Hospital Discharge Homecare Area 4">Hospital Discharge Homecare Area 4</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Maintenance - 2 Carers">Maintenance - 2 Carers</option>
            <option value="Maintenance 3 Carers">Maintenance 3 Carers</option>
            <option value="Maintenance 4 Carers">Maintenance 4 Carers</option>
            <option value="Maintenance - 5 Carers">Maintenance - 5 Carers</option>
            <option value="Maintenance 5 Carers">Maintenance 5 Carers</option>
          </select>
        </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.(council)}
            disabled={!!saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

