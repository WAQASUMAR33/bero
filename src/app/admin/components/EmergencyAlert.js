'use client';

import { useState, useEffect, useRef } from 'react';

export default function EmergencyAlert({ user, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const pollingIntervalRef = useRef(null);
  const beepIntervalRef = useRef(null);

  // Fetch emergency alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/emergency?unreadOnly=true', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const activeAlerts = data.data.filter(a => a.status === 'ACTIVE');
          setAlerts(data.data);
          setActiveCount(data.activeCount || 0);

          // Play sound if there are active alerts and we haven't played it yet
          if (activeAlerts.length > 0 && !isPlaying && audioRef.current) {
            playEmergencySound();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Play emergency sound using Web Audio API
  const playEmergencySound = () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure beep sound (800Hz, emergency-like)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Gain envelope for beeping pattern
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      // Start and stop for beep pattern
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Repeat beep every 0.5 seconds
      beepIntervalRef.current = setInterval(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = 800;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.2);
      }, 500);

      // Store context for cleanup
      audioRef.current = { context: audioContext };
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing emergency sound:', error);
      // Fallback: try HTML5 audio if available
      if (audioRef.current && audioRef.current.tagName === 'AUDIO') {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio file:', err);
        });
      }
    }
  };

  // Stop sound
  const stopSound = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    if (audioRef.current && audioRef.current.context) {
      audioRef.current.context.close();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  // Acknowledge alert
  const handleAcknowledge = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/emergency/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'acknowledge' })
      });

      if (res.ok) {
        await fetchAlerts();
        // If no more active alerts, stop sound
        const updatedAlerts = alerts.map(a =>
          a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a
        );
        const stillActive = updatedAlerts.filter(a => a.status === 'ACTIVE');
        if (stillActive.length === 0) {
          stopSound();
        }
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Resolve alert
  const handleResolve = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/emergency/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'resolve' })
      });

      if (res.ok) {
        await fetchAlerts();
        // If no more active alerts, stop sound
        const updatedAlerts = alerts.map(a =>
          a.id === alertId ? { ...a, status: 'RESOLVED' } : a
        );
        const stillActive = updatedAlerts.filter(a => a.status === 'ACTIVE');
        if (stillActive.length === 0) {
          stopSound();
        }
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchAlerts();

    // Poll every 30 seconds for new alerts (reduced from 5s to save DB connections)
    pollingIntervalRef.current = setInterval(() => {
      fetchAlerts();
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      stopSound();
    };
  }, []);

  // Stop sound when component unmounts or alerts are cleared
  useEffect(() => {
    if (activeCount === 0) {
      stopSound();
    }
  }, [activeCount]);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'ACKNOWLEDGED');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/50">
      {/* Emergency Sound - Web Audio API is used in playEmergencySound function */}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Emergency Alerts</h2>
              <p className="text-red-100 text-sm">
                {activeCount > 0 ? `${activeCount} active emergency${activeCount > 1 ? 'ies' : ''}` : 'No active emergencies'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={stopSound}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
              >
                🔇 Stop Sound
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No emergency alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Active Emergencies ({activeAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <EmergencyAlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={() => handleAcknowledge(alert.id)}
                        onResolve={() => handleResolve(alert.id)}
                        isActive={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Acknowledged Alerts */}
              {acknowledgedAlerts.length > 0 && (
                <div className={activeAlerts.length > 0 ? 'mt-6' : ''}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Acknowledged ({acknowledgedAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {acknowledgedAlerts.map((alert) => (
                      <EmergencyAlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={() => handleAcknowledge(alert.id)}
                        onResolve={() => handleResolve(alert.id)}
                        isActive={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmergencyAlertCard({ alert, onAcknowledge, onResolve, isActive }) {
  const timeAgo = getTimeAgo(new Date(alert.createdAt));

  return (
    <div className={`border-2 rounded-xl p-4 ${isActive
        ? 'border-red-500 bg-red-50 animate-pulse'
        : 'border-yellow-300 bg-yellow-50'
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {alert.triggeredByUser?.profilePic ? (
              <img
                src={alert.triggeredByUser.profilePic}
                alt={`${alert.triggeredByUser.firstName} ${alert.triggeredByUser.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center">
                <span className="text-red-700 font-semibold">
                  {alert.triggeredByUser?.firstName?.[0]}{alert.triggeredByUser?.lastName?.[0]}
                </span>
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {alert.triggeredByUser?.firstName} {alert.triggeredByUser?.lastName}
              </div>
              <div className="text-sm text-gray-600">
                {alert.triggeredByUser?.role?.displayName || alert.triggeredByUser?.role?.name}
                {alert.team && ` · ${alert.team.name}`}
              </div>
            </div>
          </div>

          {alert.message && (
            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-700">{alert.message}</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeAgo}
            </div>
            {alert.location && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {alert.location}
              </div>
            )}
            {alert.acknowledgedByUser && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Acknowledged by {alert.acknowledgedByUser.firstName} {alert.acknowledgedByUser.lastName}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {isActive && (
            <>
              <button
                onClick={onAcknowledge}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Acknowledge
              </button>
              <button
                onClick={onResolve}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Resolve
              </button>
            </>
          )}
          {!isActive && alert.status === 'ACKNOWLEDGED' && (
            <button
              onClick={onResolve}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Resolve
            </button>
          )}
          {alert.status === 'RESOLVED' && (
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium whitespace-nowrap">
              Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

