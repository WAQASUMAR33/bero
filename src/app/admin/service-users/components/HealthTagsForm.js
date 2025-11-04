'use client';

import { useEffect, useState } from 'react';

const DEFAULT_HEALTH_TAGS = [
  'Acquired Brain Injury',
  'ADHD',
  'Advanced Dementia',
  'AF',
  'Anxiety',
  'Autism',
  'Dementia',
  'Learning Disability',
  'OCD',
];

export default function HealthTagsForm({ serviceSeekerId, onNotification }) {
  const [healthTags, setHealthTags] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTagName, setCustomTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const fetchHealthTags = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/health-tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealthTags(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthTags();
  }, [serviceSeekerId]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleAddTags = async () => {
    if (selectedTags.length === 0 && !customTagName.trim()) {
      onNotification?.({ show: true, message: 'Please select at least one tag or add a custom tag.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tagsToAdd = [...selectedTags];
      if (customTagName.trim()) {
        tagsToAdd.push(customTagName.trim());
      }

      // Add all selected tags
      for (const tagName of tagsToAdd) {
        const isCustom = !DEFAULT_HEALTH_TAGS.includes(tagName);
        const res = await fetch(`/api/service-seekers/${serviceSeekerId}/health-tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tagName, isCustom }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to add health tag' }));
          if (err.error && !err.error.includes('already exists')) {
            onNotification?.({ show: true, message: err.error || 'Failed to add health tag.', type: 'error' });
          }
        }
      }

      // Refresh list
      await fetchHealthTags();
      setSelectedTags([]);
      setCustomTagName('');
      setShowAddModal(false);
      onNotification?.({ show: true, message: 'Health tags added successfully.', type: 'success' });
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: 'Failed to add health tags.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setTagToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setTagToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/health-tags?id=${tagToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHealthTags(prev => prev.filter(tag => tag.id !== tagToDelete));
        onNotification?.({ show: true, message: 'Health tag deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete health tag' }));
        onNotification?.({ show: true, message: err?.error || 'Failed to delete health tag.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: 'Failed to delete health tag.', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setTagToDelete(null);
    }
  };

  const handleCancel = () => {
    setSelectedTags([]);
    setCustomTagName('');
    setShowAddModal(false);
  };

  const existingTagNames = healthTags.map(t => t.tagName);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Health Tags</h2>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#224fa6] border-gray-300 rounded mr-3"
                readOnly
              />
              <span className="text-sm font-semibold text-gray-700">Health Tag</span>
              <button className="ml-auto text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {healthTags.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No health tags added yet.</div>
              ) : (
                healthTags.map((tag, idx) => (
                  <div
                    key={tag.id}
                    className={`px-4 py-3 flex items-center border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-4 h-4 text-[#224fa6] border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm text-gray-900 flex-1">{tag.tagName}</span>
                    {tag.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                if (healthTags.length > 0 && healthTags.some(t => t.isCustom)) {
                  // Delete all custom tags
                  const customTags = healthTags.filter(t => t.isCustom);
                  customTags.forEach(tag => handleDelete(tag.id));
                }
              }}
              className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
              title="Delete"
              disabled={!healthTags.some(t => t.isCustom)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center text-white text-2xl font-light transition-colors"
            aria-label="Add health tag"
          >
            +
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add Health Tags</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Default Tags */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Select Health Tags</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {DEFAULT_HEALTH_TAGS.map((tag) => {
                      const isChecked = selectedTags.includes(tag) || existingTagNames.includes(tag);
                      return (
                        <label
                          key={tag}
                          className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded ${existingTagNames.includes(tag) ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => !existingTagNames.includes(tag) && handleTagToggle(tag)}
                            disabled={existingTagNames.includes(tag)}
                            className="w-4 h-4 text-[#224fa6] border-gray-300 rounded focus:ring-[#224fa6]"
                          />
                          <span className="text-sm text-gray-900">{tag}</span>
                          {existingTagNames.includes(tag) && (
                            <span className="text-xs text-gray-500">(Already added)</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom Tag */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Add Custom Health Tag</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customTagName}
                    onChange={e => setCustomTagName(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter custom health tag name"
                  />
                </div>
              </div>

              {/* Existing Tags List */}
              {healthTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Health Tags</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {healthTags.map((tag, idx) => (
                        <div key={tag.id} className={`p-3 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-sm text-gray-900">{tag.tagName}</span>
                          {tag.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddModal(false);
                                handleDelete(tag.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTags}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70"
                >
                  {saving ? 'Adding...' : 'Add Tags'}
                </button>
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
                Delete Health Tag
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this health tag? This action cannot be undone.
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
    </>
  );
}

