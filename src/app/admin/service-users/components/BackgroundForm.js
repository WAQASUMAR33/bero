'use client';

import { useState } from 'react';
import LocationMap from './LocationMap';

export default function BackgroundForm({ background, setField, onSave, saving }) {
  const [showMap, setShowMap] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
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
                  if (background.postcode || background.addressLine1) {
                    const query = [
                      background.addressLine1,
                      background.addressLine2,
                      background.addressLine3,
                      background.postcode
                    ].filter(Boolean).join(', ');
                    setMapSearch(query);
                  }
                  setShowMap(true);
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


        {/* Map Modal */}
        {
          showMap && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-lg text-gray-900">Locate Address</h3>
                  <button
                    onClick={() => setShowMap(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Location</label>
                    <div className="flex gap-2">
                      <input
                        value={mapSearch}
                        onChange={(e) => setMapSearch(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                        placeholder="Enter address or postcode"
                      />
                    </div>
                  </div>

                  <div className="border rounded-xl overflow-hidden shadow-inner">
                    <LocationMap
                      searchQuery={mapSearch}
                      latitude={background.addressLatitude ? parseFloat(background.addressLatitude) : undefined}
                      longitude={background.addressLongitude ? parseFloat(background.addressLongitude) : undefined}
                      onLocationSelect={(lat, lng) => {
                        setField('addressLatitude', lat.toFixed(6));
                        setField('addressLongitude', lng.toFixed(6));
                      }}
                      className="w-full h-96"
                    />
                  </div>

                  <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>Click on the map to place the marker at the exact location. The coordinates will be updated automatically.</p>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowMap(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowMap(false)}
                    className="px-4 py-2 bg-[#224fa6] text-white rounded-lg font-medium hover:bg-[#1a3d85]"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}
