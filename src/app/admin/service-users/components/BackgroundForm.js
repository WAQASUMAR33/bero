'use client';

export default function BackgroundForm({ background, setField, onSave, saving }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Background</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Marital Status</label>
          <select
            value={background.maritalStatus || ''}
            onChange={e => setField('maritalStatus', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="Cohabiting">Cohabiting</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Religion</label>
          <input
            value={background.religion || ''}
            onChange={e => setField('religion', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter religion"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ethnicity</label>
          <input
            value={background.ethnicity || ''}
            onChange={e => setField('ethnicity', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter ethnicity"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Communication preference</label>
          <select
            value={background.communicationPreference || ''}
            onChange={e => setField('communicationPreference', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="Telephone">Telephone</option>
            <option value="Letter">Letter</option>
            <option value="Email">Email</option>
            <option value="Text Message">Text Message</option>
            <option value="Face To Face">Face To Face</option>
            <option value="Relative">Relative</option>
            <option value="Trusted Person">Trusted Person</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Emergency Rating</label>
          <select
            value={background.emergencyRating || ''}
            onChange={e => setField('emergencyRating', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Address</h3>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address line 1</label>
          <input
            value={background.addressLine1 || ''}
            onChange={e => setField('addressLine1', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter address line 1"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address line 2</label>
          <input
            value={background.addressLine2 || ''}
            onChange={e => setField('addressLine2', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter address line 2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address line 3</label>
          <input
            value={background.addressLine3 || ''}
            onChange={e => setField('addressLine3', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter address line 3"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address line 4</label>
          <input
            value={background.addressLine4 || ''}
            onChange={e => setField('addressLine4', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter address line 4"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address line 5</label>
          <input
            value={background.addressLine5 || ''}
            onChange={e => setField('addressLine5', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter address line 5"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Postcode</label>
          <div className="flex items-center space-x-2">
            <input
              value={background.postcode || ''}
              onChange={e => setField('postcode', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
              placeholder="Enter postcode"
            />
            <button
              type="button"
              onClick={() => {
                if (background.postcode) {
                  // Placeholder for geocoding functionality
                  console.log('Locate:', background.postcode);
                }
              }}
              className="px-4 py-2 text-sm text-[#224fa6] hover:underline whitespace-nowrap"
            >
              Locate
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Address Latitude, Longitude</label>
          <div className="flex items-center space-x-2">
            <input
              value={background.addressLatitude && background.addressLongitude ? `${background.addressLatitude},${background.addressLongitude}` : ''}
              onChange={e => {
                const parts = e.target.value.split(',');
                setField('addressLatitude', parts[0] || '');
                setField('addressLongitude', parts[1] || '');
              }}
              className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
              placeholder="Enter latitude, longitude"
            />
            <button
              type="button"
              onClick={() => {
                if (background.addressLatitude && background.addressLongitude) {
                  const url = `https://www.google.com/maps?q=${background.addressLatitude},${background.addressLongitude}`;
                  window.open(url, '_blank');
                }
              }}
              className="px-4 py-2 text-sm text-[#224fa6] hover:underline whitespace-nowrap"
            >
              View on map
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Region</label>
          <select
            value={background.region || ''}
            onChange={e => setField('region', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="NORTH">North</option>
            <option value="SOUTH">South</option>
            <option value="EAST">East</option>
            <option value="WEST">West</option>
            <option value="CENTRAL">Central</option>
          </select>
        </div>
        <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact Details</h3>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Key Safe Code</label>
          <input
            value={background.keySafeCode || ''}
            onChange={e => setField('keySafeCode', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter key safe code"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Access Details</label>
          <textarea
            value={background.accessDetails || ''}
            onChange={e => setField('accessDetails', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            rows={3}
            placeholder="Enter access details"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Telephone</label>
          <input
            type="tel"
            value={background.telephone || ''}
            onChange={e => setField('telephone', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter telephone number"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mobile</label>
          <input
            type="tel"
            value={background.mobile || ''}
            onChange={e => setField('mobile', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter mobile number"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={background.email || ''}
            onChange={e => setField('email', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Preferred contact method</label>
          <select
            value={background.preferredContactMethod || ''}
            onChange={e => setField('preferredContactMethod', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="UK Telephone Number">UK Telephone Number</option>
            <option value="Other non UK Telephone Number">Other non UK Telephone Number</option>
            <option value="UK Facsimile Number">UK Facsimile Number</option>
            <option value="Internet e-Mail Address">Internet e-Mail Address</option>
            <option value="Uniform Resource Locator (URL)">Uniform Resource Locator (URL)</option>
            <option value="Pager">Pager</option>
          </select>
        </div>
      </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.(background)}
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

