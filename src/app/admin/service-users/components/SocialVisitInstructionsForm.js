'use client';

import { useEffect, useState } from 'react';

export default function SocialVisitInstructionsForm({ serviceSeekerId, onNotification }) {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInstructions();
  }, [serviceSeekerId]);

  const fetchInstructions = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/social-visit-instructions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstructions(data.instructions || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveInstructions = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/social-visit-instructions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instructions }),
      });
      if (res.ok) {
        if (onNotification)
          onNotification({ show: true, message: 'Instructions saved.', type: 'success' });
      } else {
        if (onNotification)
          onNotification({ show: true, message: 'Failed to save instructions.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save instructions.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-orange-500">
      {/* Orange Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Social Visit Instructions</h2>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 min-h-[200px] resize-y"
            placeholder="Enter social visit instructions..."
          />

          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={saveInstructions}
              disabled={saving}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="mt-4 text-sm text-green-600">
            Please create rota shifts with type set to &apos;social visit&apos; to generate social visit tasks listing these notes
          </div>
        </>
      )}
      </div>
    </div>
  );
}

