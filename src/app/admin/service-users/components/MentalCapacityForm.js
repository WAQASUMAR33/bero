'use client';

import { useEffect, useState } from 'react';

export default function MentalCapacityForm({ serviceSeekerId, onNotification }) {
  const [mentalCapacities, setMentalCapacities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [capacityToDelete, setCapacityToDelete] = useState(null);
  const [formData, setFormData] = useState({
    mca: '',
    capacity: '',
    bestInterests: '',
    score: '',
    dols: '',
    appliedForDate: '',
    dolsStartDate: '',
    dolsEndDate: '',
    dolsNotes: '',
    cqcInformed: false,
    dolsAppliedForDate: '',
  });

  const fetchMentalCapacities = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/mental-capacity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMentalCapacities(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentalCapacities();
  }, [serviceSeekerId]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset conditional fields when DOLS changes
      if (field === 'dols') {
        if (value === 'N/A' || value === '') {
          updated.appliedForDate = '';
          updated.dolsStartDate = '';
          updated.dolsEndDate = '';
          updated.dolsNotes = '';
          updated.cqcInformed = false;
          updated.dolsAppliedForDate = '';
        } else if (value === 'APPLIED_FOR') {
          // Only keep appliedForDate, clear others
          updated.dolsStartDate = '';
          updated.dolsEndDate = '';
          updated.dolsNotes = '';
          updated.cqcInformed = false;
          updated.dolsAppliedForDate = '';
        } else if (value === 'APPROVED') {
          // Clear appliedForDate (different from dolsAppliedForDate)
          updated.appliedForDate = '';
        } else if (value === 'REJECTED') {
          // Clear appliedForDate and approved-specific fields
          updated.appliedForDate = '';
          updated.dolsStartDate = '';
          updated.dolsEndDate = '';
          updated.cqcInformed = false;
        }
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = editingId !== null;
      const url = `/api/service-seekers/${serviceSeekerId}/mental-capacity`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        ...(isEdit ? { id: editingId } : {}),
      };

      // Clear fields based on DOLS selection
      if (payload.dols === 'N/A' || !payload.dols) {
        payload.appliedForDate = null;
        payload.dolsStartDate = null;
        payload.dolsEndDate = null;
        payload.dolsNotes = null;
        payload.cqcInformed = false;
        payload.dolsAppliedForDate = null;
      } else if (payload.dols === 'APPLIED_FOR') {
        // Only keep appliedForDate
        payload.dolsStartDate = null;
        payload.dolsEndDate = null;
        payload.dolsNotes = null;
        payload.cqcInformed = false;
        payload.dolsAppliedForDate = null;
      } else if (payload.dols === 'APPROVED') {
        // Clear appliedForDate (use dolsAppliedForDate instead)
        payload.appliedForDate = null;
      } else if (payload.dols === 'REJECTED') {
        // Clear appliedForDate and approved-specific fields
        payload.appliedForDate = null;
        payload.dolsStartDate = null;
        payload.dolsEndDate = null;
        payload.cqcInformed = false;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setMentalCapacities(prev => prev.map(item => item.id === editingId ? data : item));
          onNotification?.({ show: true, message: 'Mental capacity updated successfully.', type: 'success' });
        } else {
          setMentalCapacities(prev => [data, ...prev]);
          onNotification?.({ show: true, message: 'Mental capacity added successfully.', type: 'success' });
        }
        resetForm();
        setShowAddModal(false);
      } else {
        const err = await res.json().catch(() => ({ error: `Failed to ${isEdit ? 'update' : 'add'} mental capacity` }));
        onNotification?.({ show: true, message: err?.error || `Failed to ${isEdit ? 'update' : 'add'} mental capacity.`, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: `Failed to ${editingId ? 'update' : 'add'} mental capacity.`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      mca: item.mca ? new Date(item.mca).toISOString().substring(0, 10) : '',
      capacity: item.capacity || '',
      bestInterests: item.bestInterests || '',
      score: item.score || '',
      dols: item.dols || '',
      appliedForDate: item.appliedForDate ? new Date(item.appliedForDate).toISOString().substring(0, 10) : '',
      dolsStartDate: item.dolsStartDate ? new Date(item.dolsStartDate).toISOString().substring(0, 10) : '',
      dolsEndDate: item.dolsEndDate ? new Date(item.dolsEndDate).toISOString().substring(0, 10) : '',
      dolsNotes: item.dolsNotes || '',
      cqcInformed: item.cqcInformed || false,
      dolsAppliedForDate: item.dolsAppliedForDate ? new Date(item.dolsAppliedForDate).toISOString().substring(0, 10) : '',
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    setCapacityToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCapacityToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!capacityToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/mental-capacity?id=${capacityToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMentalCapacities(prev => prev.filter(item => item.id !== capacityToDelete));
        onNotification?.({ show: true, message: 'Mental capacity deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete mental capacity' }));
        onNotification?.({ show: true, message: err?.error || 'Failed to delete mental capacity.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: 'Failed to delete mental capacity.', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setCapacityToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      mca: '',
      capacity: '',
      bestInterests: '',
      score: '',
      dols: '',
      appliedForDate: '',
      dolsStartDate: '',
      dolsEndDate: '',
      dolsNotes: '',
      cqcInformed: false,
      dolsAppliedForDate: '',
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowAddModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const showAppliedForDate = formData.dols === 'APPLIED_FOR';
  const showApprovedFields = formData.dols === 'APPROVED';
  const showRejectedFields = formData.dols === 'REJECTED';
  const showDolsAppliedForDate = formData.dols === 'APPROVED' || formData.dols === 'REJECTED';

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mental Capacity</h2>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : mentalCapacities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No mental capacity records added yet.</p>
            <p className="text-sm text-gray-400">Click the Add button to add a record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MCA</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Best Interests</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DOLS</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DOLS Start Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DOLS End Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mentalCapacities.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(item.mca)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.capacity || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.bestInterests || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.score || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.dols || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(item.dolsStartDate)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(item.dolsEndDate)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.updatedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-green-600">You can add mental capacity records for the Service User here</span>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl text-green-600 font-light transition-colors"
            aria-label="Add mental capacity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Capacity' : 'Add Capacity'}</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">MCA</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.mca}
                      onChange={e => handleFieldChange('mca', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900 pr-10"
                    />
                    <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Capacity</label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={e => handleFieldChange('capacity', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter capacity"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Best Interests</label>
                  <select
                    value={formData.bestInterests}
                    onChange={e => handleFieldChange('bestInterests', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Please Select</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Score</label>
                  <input
                    type="text"
                    value={formData.score}
                    onChange={e => handleFieldChange('score', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter score"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">DOLS</label>
                  <select
                    value={formData.dols}
                    onChange={e => handleFieldChange('dols', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Please Select</option>
                    <option value="N/A">n/a</option>
                    <option value="APPLIED_FOR">applied for</option>
                    <option value="APPROVED">approved</option>
                    <option value="REJECTED">rejected</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {showAppliedForDate && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Applied For Date</label>
                    <input
                      type="date"
                      value={formData.appliedForDate}
                      onChange={e => handleFieldChange('appliedForDate', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                )}

                {showApprovedFields && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">DOLS Start Date</label>
                      <input
                        type="date"
                        value={formData.dolsStartDate}
                        onChange={e => handleFieldChange('dolsStartDate', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">DOLS End Date</label>
                      <input
                        type="date"
                        value={formData.dolsEndDate}
                        onChange={e => handleFieldChange('dolsEndDate', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                  </>
                )}

                {(showApprovedFields || showRejectedFields) && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">DOLS Notes</label>
                      <textarea
                        value={formData.dolsNotes}
                        onChange={e => handleFieldChange('dolsNotes', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                        rows={3}
                        placeholder="Enter DOLS notes"
                      />
                    </div>
                  </>
                )}

                {showDolsAppliedForDate && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">DOLS Applied For Date</label>
                    <input
                      type="date"
                      value={formData.dolsAppliedForDate}
                      onChange={e => handleFieldChange('dolsAppliedForDate', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                )}

                {showApprovedFields && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.cqcInformed}
                        onChange={e => handleFieldChange('cqcInformed', e.target.checked)}
                        className="w-4 h-4 text-[#224fa6] border-gray-300 rounded focus:ring-[#224fa6]"
                      />
                      <span className="text-sm text-gray-600">CQC Informed</span>
                    </label>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Documents</label>
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center hover:border-gray-400 transition-colors"
                    onClick={() => {
                      // File upload will be implemented later
                      alert('File upload feature will be available soon');
                    }}
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">Click to upload file</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
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
                Delete Mental Capacity Record
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this mental capacity record? This action cannot be undone.
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

