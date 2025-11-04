'use client';

import { useEffect, useState } from 'react';

export default function DietForm({ diet, setField, onSave, saving }) {
  const [diets, setDiets] = useState([]);
  const [showDietModal, setShowDietModal] = useState(false);
  const [newDietName, setNewDietName] = useState('');
  const [editingDietId, setEditingDietId] = useState(null);
  const [editingDietName, setEditingDietName] = useState('');
  const [loadingDiets, setLoadingDiets] = useState(false);
  const [savingDiet, setSavingDiet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dietToDelete, setDietToDelete] = useState(null);

  const fetchDiets = async () => {
    setLoadingDiets(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/diets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDiets(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDiets(false);
    }
  };

  useEffect(() => {
    fetchDiets();
  }, []);

  const handleAddDiet = async () => {
    if (!newDietName.trim()) {
      return;
    }
    setSavingDiet(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/diets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newDietName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiets(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewDietName('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to add diet' }));
        console.error(err?.error || 'Failed to add diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDiet(false);
    }
  };

  const handleEditDiet = async () => {
    if (!editingDietName.trim() || !editingDietId) {
      return;
    }
    setSavingDiet(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/diets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingDietId, name: editingDietName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiets(prev => prev.map(d => d.id === editingDietId ? data : d).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingDietId(null);
        setEditingDietName('');
        // Update mainDiet if it was the edited diet
        if (diet.mainDiet === diets.find(d => d.id === editingDietId)?.name) {
          setField('mainDiet', data.name);
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update diet' }));
        console.error(err?.error || 'Failed to update diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDiet(false);
    }
  };

  const handleDelete = (id) => {
    setDietToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDietToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!dietToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/diets?id=${dietToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const deletedDiet = diets.find(d => d.id === dietToDelete);
        setDiets(prev => prev.filter(d => d.id !== dietToDelete));
        // Clear mainDiet if it was the deleted diet
        if (diet.mainDiet === deletedDiet?.name) {
          setField('mainDiet', '');
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete diet' }));
        console.error(err?.error || 'Failed to delete diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowDeleteConfirm(false);
      setDietToDelete(null);
    }
  };

  const handleStartEdit = (dietItem) => {
    setEditingDietId(dietItem.id);
    setEditingDietName(dietItem.name);
    setNewDietName('');
  };

  const handleCancelEdit = () => {
    setEditingDietId(null);
    setEditingDietName('');
    setNewDietName('');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Diet</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Food Allergies</label>
            <textarea
              value={diet.foodAllergies || ''}
              onChange={e => setField('foodAllergies', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-900"
              rows={4}
              placeholder="None"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nil By Mouth</label>
            <select
              value={diet.nilByMouth || ''}
              onChange={e => setField('nilByMouth', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-900"
            >
              <option value="">Please Select</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Main Diet</label>
            <div className="flex items-center space-x-2">
              <select
                value={diet.mainDiet || ''}
                onChange={e => setField('mainDiet', e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                disabled={loadingDiets}
              >
                <option value="">Please Select</option>
                {diets.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditingDietId(null);
                  setEditingDietName('');
                  setNewDietName('');
                  setShowDietModal(true);
                  fetchDiets();
                }}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-green-600 font-bold transition-colors"
                title="Manage Diets"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Special Diets</label>
            <select
              value={diet.specialDiet || ''}
              onChange={e => setField('specialDiet', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-900"
            >
              <option value="">Please Select</option>
              <option value="N/A">N/A</option>
              <option value="Pure Food">Pure Food</option>
              <option value="Soft Food">Soft Food</option>
              <option value="Food Thickener">Food Thickener</option>
              <option value="Nutritional Supplement">Nutritional Supplement</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Instructions</label>
            <textarea
              value={diet.dietInstructions || ''}
              onChange={e => setField('dietInstructions', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-900"
              rows={4}
              placeholder="Enter instructions"
            />
            <p className="text-xs text-green-600 mt-1">Will be shown to carer</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.(diet)}
            disabled={!!saving}
            className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Diet Management Modal */}
      {showDietModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Manage Main Diets</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDietModal(false);
                    handleCancelEdit();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Add/Edit Form */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  {editingDietId ? 'Edit Diet' : 'Add New Diet'}
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingDietId ? editingDietName : newDietName}
                    onChange={e => {
                      if (editingDietId) {
                        setEditingDietName(e.target.value);
                      } else {
                        setNewDietName(e.target.value);
                      }
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        if (editingDietId) {
                          handleEditDiet();
                        } else {
                          handleAddDiet();
                        }
                      }
                    }}
                    className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter diet name"
                  />
                  {editingDietId ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEditDiet}
                        disabled={!editingDietName.trim() || savingDiet}
                        className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingDiet ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingDiet}
                        className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddDiet}
                      disabled={!newDietName.trim() || savingDiet}
                      className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingDiet ? 'Adding...' : 'Add'}
                    </button>
                  )}
                </div>
              </div>

              {/* Existing Diets List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Diets</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {loadingDiets ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                  ) : diets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No diets added yet. Add your first diet above.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {diets.map((dietItem, idx) => (
                        <div key={dietItem.id} className={`p-4 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">{dietItem.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Created: {new Date(dietItem.createdAt).toLocaleDateString()}, 
                              Updated: {new Date(dietItem.updatedAt).toLocaleDateString()})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(dietItem)}
                              disabled={!!editingDietId}
                              className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(dietItem.id)}
                              disabled={!!editingDietId}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
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
                Delete Diet
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{diets.find(d => d.id === dietToDelete)?.name}&quot;</span>? 
                This action cannot be undone.
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

