'use client';

import { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  VALID:       { label: 'Valid',       bg: 'bg-green-50',  border: 'border-green-400', badge: 'bg-green-100 text-green-800',   dot: 'bg-green-500', icon: '✓' },
  EXPIRING_30: { label: 'Expiring',    bg: 'bg-red-50',    border: 'border-red-400',   badge: 'bg-red-100 text-red-800',       dot: 'bg-red-500',   icon: '!' },
  EXPIRING_60: { label: 'Expiring',    bg: 'bg-orange-50', border: 'border-orange-400',badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500',icon: '!' },
  EXPIRING_90: { label: 'Expiring',    bg: 'bg-yellow-50', border: 'border-yellow-400',badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500',icon: '!' },
  EXPIRED:     { label: 'EXPIRED',     bg: 'bg-red-50',    border: 'border-red-600',   badge: 'bg-red-200 text-red-900',       dot: 'bg-red-700',   icon: '✗' },
  MISSING:     { label: 'Not recorded',bg: 'bg-gray-50',   border: 'border-gray-300',  badge: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400',  icon: '?' },
};

function getStatus(record) {
  if (!record) return 'MISSING';
  if (!record.expiryDate) return 'VALID';
  const today = new Date();
  const expiry = new Date(record.expiryDate);
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'EXPIRING_30';
  if (days <= 60) return 'EXPIRING_60';
  if (days <= 90) return 'EXPIRING_90';
  return 'VALID';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
}

export default function MyTrainingPage() {
  const [trainingData, setTrainingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyTraining();
  }, []);

  const fetchMyTraining = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) { setError('Not authenticated'); return; }
      const userId = JSON.parse(storedUser).id;

      const [typesRes, recordsRes] = await Promise.all([
        fetch('/api/training/types', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/training/records?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [typesData, recordsData] = await Promise.all([typesRes.json(), recordsRes.json()]);

      if (!typesData.success) { setError('Failed to load training data'); return; }

      // Get latest record per training type
      const latestByType = {};
      if (recordsData.success) {
        recordsData.data.forEach(r => {
          if (!latestByType[r.trainingTypeId] || new Date(r.completedDate) > new Date(latestByType[r.trainingTypeId].completedDate)) {
            latestByType[r.trainingTypeId] = r;
          }
        });
      }

      const combined = typesData.data.map(tt => ({
        ...tt,
        record: latestByType[tt.id] || null,
        status: getStatus(latestByType[tt.id])
      }));

      // Sort: expired first, then expiring, then missing, then valid
      const order = { EXPIRED: 0, EXPIRING_30: 1, EXPIRING_60: 2, EXPIRING_90: 3, MISSING: 4, VALID: 5 };
      combined.sort((a, b) => order[a.status] - order[b.status]);

      setTrainingData(combined);
    } catch { setError('Failed to load training data'); }
    finally { setIsLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const expiredCount = trainingData.filter(t => t.status === 'EXPIRED').length;
  const expiringCount = trainingData.filter(t => ['EXPIRING_30', 'EXPIRING_60', 'EXPIRING_90'].includes(t.status)).length;
  const validCount = trainingData.filter(t => t.status === 'VALID').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your training profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Training</h1>
        <p className="text-gray-500 text-sm mt-1">Your training certificates and compliance status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-700">{validCount}</div>
          <div className="text-xs text-green-600 font-medium mt-1">Valid</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{expiringCount}</div>
          <div className="text-xs text-yellow-600 font-medium mt-1">Expiring</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-700">{expiredCount}</div>
          <div className="text-xs text-red-600 font-medium mt-1">Expired</div>
        </div>
      </div>

      {/* Training Cards */}
      <div className="space-y-3">
        {trainingData.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No training types have been set up yet. Contact your manager.
          </div>
        ) : trainingData.map(item => {
          const cfg = STATUS_CONFIG[item.status];
          const days = item.record?.expiryDate ? daysUntil(item.record.expiryDate) : null;
          return (
            <div key={item.id} className={`bg-white rounded-xl border-l-4 border shadow-sm p-4 ${cfg.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${cfg.dot}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}

                    {item.record ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>Completed: <span className="font-medium text-gray-800">{fmt(item.record.completedDate)}</span></span>
                          {item.record.expiryDate && (
                            <span className={days !== null && days < 0 ? 'text-red-600 font-semibold' : ''}>
                              Expires: <span className="font-medium">{fmt(item.record.expiryDate)}</span>
                              {days !== null && days >= 0 && <span className="ml-1 text-gray-400">({days}d)</span>}
                            </span>
                          )}
                        </div>
                        {item.record.provider && (
                          <div className="text-xs text-gray-500">Provider: {item.record.provider}</div>
                        )}
                        {item.record.certificateUrl && (
                          <a href={item.record.certificateUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-[#224fa6] hover:underline mt-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Certificate</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-gray-400">No record on file — speak to your manager</p>
                    )}
                  </div>
                </div>
                <span className={`ml-3 flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>
                  {item.isMandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>

              {/* Expiry warning bar */}
              {days !== null && days >= 0 && days <= 90 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Time remaining</span>
                    <span className={`font-medium ${days <= 30 ? 'text-red-600' : days <= 60 ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {days} days
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full">
                    <div className={`h-1.5 rounded-full transition-all ${days <= 30 ? 'bg-red-500' : days <= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.max(2, (days / 90) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        To update certificates, speak to your manager or HR.
      </p>
    </div>
  );
}
