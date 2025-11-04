'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_TEAM_OPTIONS = [
  'Dementia Specialist Nurse',
  'Dietician',
  'District Nurse',
  'General Practitioner',
  'Hen',
  'MDT',
  'Occupational Therapist',
  'Physio',
  'Police',
  'Probation Officer',
  'SALT',
  'Social Worker',
];

export default function HealthForm({ health, setField, onSave, saving }) {
  const [teamInvolvement, setTeamInvolvement] = useState([]);
  const [teamOptions, setTeamOptions] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teamInvolvementOptions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return DEFAULT_TEAM_OPTIONS;
        }
      }
    }
    return DEFAULT_TEAM_OPTIONS;
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  useEffect(() => {
    if (health.teamInvolvement) {
      if (Array.isArray(health.teamInvolvement)) {
        setTeamInvolvement(health.teamInvolvement);
      } else {
        try {
          const parsed = typeof health.teamInvolvement === 'string' ? JSON.parse(health.teamInvolvement) : health.teamInvolvement;
          setTeamInvolvement(Array.isArray(parsed) ? parsed : []);
        } catch {
          setTeamInvolvement([]);
        }
      }
    } else {
      setTeamInvolvement([]);
    }
  }, [health.teamInvolvement]);

  const saveTeamOptions = (options) => {
    setTeamOptions(options);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teamInvolvementOptions', JSON.stringify(options));
    }
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamOptions.includes(newTeamName.trim())) {
      const updated = [...teamOptions, newTeamName.trim()];
      saveTeamOptions(updated);
      setNewTeamName('');
    }
  };

  const handleDeleteTeam = (team) => {
    setTeamToDelete(team);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setTeamToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (teamToDelete) {
      const updated = teamOptions.filter(t => t !== teamToDelete);
      saveTeamOptions(updated);
      // Remove from selected teams if it was selected
      if (teamInvolvement.includes(teamToDelete)) {
        const updatedSelection = teamInvolvement.filter(t => t !== teamToDelete);
        setTeamInvolvement(updatedSelection);
        setField('teamInvolvement', updatedSelection);
      }
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    }
  };

  const bmi = useMemo(() => {
    if (health.height && health.weight) {
      const h = parseFloat(health.height);
      const w = parseFloat(health.weight);
      if (h > 0 && w > 0) {
        const calculated = (w / (h * h)).toFixed(2);
        return calculated;
      }
    }
    return '';
  }, [health.height, health.weight]);

  const handleTeamInvolvementToggle = (team) => {
    setTeamInvolvement(prev => {
      const newArray = prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team];
      setField('teamInvolvement', newArray);
      return newArray;
    });
  };

  const handleHeightChange = (value) => {
    setField('height', value);
    // Auto-calculate BMI
    if (value && health.weight) {
      const h = parseFloat(value);
      const w = parseFloat(health.weight);
      if (h > 0 && w > 0) {
        const calculated = (w / (h * h)).toFixed(2);
        setField('bmi', calculated);
      }
    }
  };

  const handleWeightChange = (value) => {
    setField('weight', value);
    // Auto-calculate BMI
    if (value && health.height) {
      const h = parseFloat(health.height);
      const w = parseFloat(value);
      if (h > 0 && w > 0) {
        const calculated = (w / (h * h)).toFixed(2);
        setField('bmi', calculated);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Health</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Height (m)</label>
          <input
            type="number"
            step="0.01"
            value={health.height || ''}
            onChange={e => handleHeightChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="e.g. 1.65"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={health.weight || ''}
            onChange={e => handleWeightChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            placeholder="e.g. 64.2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">BMI (kg/m2)</label>
          <input
            type="text"
            value={bmi}
            readOnly
            className="w-full border rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
            placeholder="Auto-calculated"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Medical History</label>
          <textarea
            value={health.medicalHistory || ''}
            onChange={e => setField('medicalHistory', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            rows={4}
            placeholder="Enter medical history"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Medicine Allergies</label>
          <textarea
            value={health.medicineAllergies || ''}
            onChange={e => setField('medicineAllergies', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
            rows={4}
            placeholder="Enter medicine allergies"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Oxygen</label>
          <select
            value={health.oxygen || ''}
            onChange={e => setField('oxygen', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="AS_NEEDED">As Needed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">On Catheter</label>
          <select
            value={health.onCatheter || ''}
            onChange={e => setField('onCatheter', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">Please Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
          <p className="text-xs text-green-600 mt-1">On Bathing tasks you are able to log catheter details.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-2">Team Involvement</label>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamOptions.map((team) => (
                <label key={team} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={teamInvolvement.includes(team)}
                    onChange={() => handleTeamInvolvementToggle(team)}
                    className="w-4 h-4 text-[#224fa6] border-gray-300 rounded focus:ring-[#224fa6]"
                  />
                  <span className="text-sm text-gray-900">{team}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
          title="Manage Team Options"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onSave?.(health)}
          disabled={!!saving}
          className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Manage Team Options</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setNewTeamName('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Team */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Add New Team</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddTeam()}
                    className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter team name"
                  />
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    disabled={!newTeamName.trim() || teamOptions.includes(newTeamName.trim())}
                    className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Teams List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Teams</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {teamOptions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No teams added yet. Add your first team above.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {teamOptions.map((team, idx) => (
                        <div key={team} className={`p-4 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-sm text-gray-900">{team}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(team)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Team
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{teamToDelete}&quot;</span>? 
                This will also remove it from any selected teams. This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

