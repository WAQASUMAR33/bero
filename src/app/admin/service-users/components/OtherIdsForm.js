'use client';

import { useEffect, useState } from 'react';

export default function OtherIdsForm({ serviceSeekerId, onNotification }) {
  const [otherIds, setOtherIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newId, setNewId] = useState({ idName: '', idNumber: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const fetchOtherIds = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/other-ids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOtherIds(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOtherIds();
  }, [serviceSeekerId]);

  const handleAdd = async () => {
    if (!newId.idName.trim() || !newId.idNumber.trim()) {
      onNotification?.({ show: true, message: 'Please fill in both ID name and ID number.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = editingId !== null;
      const url = `/api/service-seekers/${serviceSeekerId}/other-ids`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...newId, id: editingId } : newId;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setOtherIds(prev => prev.map(item => item.id === editingId ? data : item));
          onNotification?.({ show: true, message: 'Other ID updated successfully.', type: 'success' });
        } else {
          setOtherIds(prev => [data, ...prev]);
          onNotification?.({ show: true, message: 'Other ID added successfully.', type: 'success' });
        }
        setNewId({ idName: '', idNumber: '' });
        setEditingId(null);
        setShowModal(false);
      } else {
        const err = await res.json().catch(() => ({ error: `Failed to ${isEdit ? 'update' : 'add'} other ID` }));
        onNotification?.({ show: true, message: err?.error || `Failed to ${isEdit ? 'update' : 'add'} other ID.`, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: `Failed to ${editingId ? 'update' : 'add'} other ID.`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewId({ idName: item.idName, idNumber: item.idNumber });
    setShowModal(true);
  };

  const handleCancel = () => {
    setNewId({ idName: '', idNumber: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setIdToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!idToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/other-ids?id=${idToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOtherIds(prev => prev.filter(item => item.id !== idToDelete));
        onNotification?.({ show: true, message: 'Other ID deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete other ID' }));
        onNotification?.({ show: true, message: err?.error || 'Failed to delete other ID.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: 'Failed to delete other ID.', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setIdToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Other IDs</h2>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : otherIds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No other IDs added yet.</p>
            <p className="text-sm text-gray-400">Click the Add button to add an ID.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID number</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherIds.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.idName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.idNumber}</td>
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
            <span className="text-green-600">You can add other IDs for the Service User here such as their Passport number</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setNewId({ idName: '', idNumber: '' });
              setShowModal(true);
            }}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl text-green-600 font-light transition-colors"
            aria-label="Add other ID"
          >
            +
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Other ID' : 'Add Other ID'}</h3>
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
              {/* Add/Edit Form */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">{editingId ? 'Edit ID' : 'Add New ID'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ID name</label>
                    <input
                      value={newId.idName}
                      onChange={e => setNewId(prev => ({ ...prev, idName: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="e.g., Passport"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ID number</label>
                    <input
                      value={newId.idNumber}
                      onChange={e => setNewId(prev => ({ ...prev, idNumber: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
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
                    onClick={handleAdd}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70"
                  >
                    {saving ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update ID' : 'Add ID')}
                  </button>
                </div>
              </div>

              {/* List View */}
              {otherIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing IDs</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">ID name</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">ID number</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Created</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherIds.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.idName}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.idNumber}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center space-x-2">
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
                </div>
              )}
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
                Delete Other ID
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this ID? This action cannot be undone.
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

