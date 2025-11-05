'use client';

import { useEffect, useState } from 'react';

export default function MedicineAccessCodesForm({ serviceSeekerId, onNotification }) {
  const [accessCodes, setAccessCodes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccessCodes();
  }, [serviceSeekerId]);

  const fetchAccessCodes = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/medicine-access-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessCodes(data.accessCodes || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveAccessCodes = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/medicine-access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessCodes }),
      });
      if (res.ok) {
        if (onNotification)
          onNotification({ show: true, message: 'Access codes saved.', type: 'success' });
      } else {
        if (onNotification)
          onNotification({ show: true, message: 'Failed to save access codes.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save access codes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-orange-500">
      {/* Orange Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Medicine Access Codes</h2>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicine Location and Access Codes
          </label>
          <textarea
            value={accessCodes}
            onChange={(e) => setAccessCodes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 min-h-[300px] resize-y bg-gray-50"
            placeholder="Enter medicine location and access codes..."
          />

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveAccessCodes}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

