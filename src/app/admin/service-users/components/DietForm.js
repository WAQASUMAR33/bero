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

  // Special Diets State
  const [specialDiets, setSpecialDiets] = useState([]);
  const [showSpecialDietModal, setShowSpecialDietModal] = useState(false);
  const [newSpecialDietName, setNewSpecialDietName] = useState('');
  const [editingSpecialDietId, setEditingSpecialDietId] = useState(null);
  const [editingSpecialDietName, setEditingSpecialDietName] = useState('');
  const [loadingSpecialDiets, setLoadingSpecialDiets] = useState(false);
  const [savingSpecialDiet, setSavingSpecialDiet] = useState(false);
  const [showSpecialDietDeleteConfirm, setShowSpecialDietDeleteConfirm] = useState(false);
  const [specialDietToDelete, setSpecialDietToDelete] = useState(null);

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

  const fetchSpecialDiets = async () => {
    setLoadingSpecialDiets(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/special-diets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialDiets(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSpecialDiets(false);
    }
  };

  useEffect(() => {
    fetchDiets();
    fetchSpecialDiets();
  }, []);

  // Main Diet Handlers
  const handleAddDiet = async () => {
    if (!newDietName.trim()) return;
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
    if (!editingDietName.trim() || !editingDietId) return;
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

  // Special Diet Handlers
  const handleAddSpecialDiet = async () => {
    if (!newSpecialDietName.trim()) return;
    setSavingSpecialDiet(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/special-diets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSpecialDietName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialDiets(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewSpecialDietName('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to add special diet' }));
        console.error(err?.error || 'Failed to add special diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSpecialDiet(false);
    }
  };

  const handleEditSpecialDiet = async () => {
    if (!editingSpecialDietName.trim() || !editingSpecialDietId) return;
    setSavingSpecialDiet(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/special-diets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingSpecialDietId, name: editingSpecialDietName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialDiets(prev => prev.map(d => d.id === editingSpecialDietId ? data : d).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingSpecialDietId(null);
        setEditingSpecialDietName('');
        if (diet.specialDiet === specialDiets.find(d => d.id === editingSpecialDietId)?.name) {
          setField('specialDiet', data.name);
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update special diet' }));
        console.error(err?.error || 'Failed to update special diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSpecialDiet(false);
    }
  };

  const handleDeleteSpecialDiet = (id) => {
    setSpecialDietToDelete(id);
    setShowSpecialDietDeleteConfirm(true);
  };

  const handleDeleteSpecialDietCancel = () => {
    setShowSpecialDietDeleteConfirm(false);
    setSpecialDietToDelete(null);
  };

  const handleDeleteSpecialDietConfirm = async () => {
    if (!specialDietToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/special-diets?id=${specialDietToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const deletedSpecialDiet = specialDiets.find(d => d.id === specialDietToDelete);
        setSpecialDiets(prev => prev.filter(d => d.id !== specialDietToDelete));
        if (diet.specialDiet === deletedSpecialDiet?.name) {
          setField('specialDiet', '');
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete special diet' }));
        console.error(err?.error || 'Failed to delete special diet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowSpecialDietDeleteConfirm(false);
      setSpecialDietToDelete(null);
    }
  };

  const handleStartEditSpecialDiet = (item) => {
    setEditingSpecialDietId(item.id);
    setEditingSpecialDietName(item.name);
    setNewSpecialDietName('');
  };

  const handleCancelEditSpecialDiet = () => {
    setEditingSpecialDietId(null);
    setEditingSpecialDietName('');
    setNewSpecialDietName('');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
        {/* Blue Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Diet</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#224fa6] font-bold transition-colors cursor-pointer"
                title="Manage Main Diets"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Special Diets</label>
            <div className="flex items-center space-x-2">
              <select
                value={diet.specialDiet || ''}
                onChange={e => setField('specialDiet', e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                disabled={loadingSpecialDiets}
              >
                <option value="">Please Select</option>
                {specialDiets.map((sd) => (
                  <option key={sd.id} value={sd.name}>{sd.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditingSpecialDietId(null);
                  setEditingSpecialDietName('');
                  setNewSpecialDietName('');
                  setShowSpecialDietModal(true);
                  fetchSpecialDiets();
                }}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#224fa6] font-bold transition-colors cursor-pointer"
                title="Manage Special Diets"
              >
                +
              </button>
            </div>
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
            <p className="text-xs text-gray-600 mt-1">Will be shown to carer</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.(diet)}
            disabled={!!saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        </div>
      </div>

      {/* Main Diet Management Modal */}
      {showDietModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manage Main Diets</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDietModal(false);
                    handleCancelEdit();
                  }}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors cursor-pointer"
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
                        className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {savingDiet ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingDiet}
                        className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddDiet}
                      disabled={!newDietName.trim() || savingDiet}
                      className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                              className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(dietItem.id)}
                              disabled={!!editingDietId}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Main Diet Delete Confirmation Modal */}
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
                Delete Main Diet
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{diets.find(d => d.id === dietToDelete)?.name}&quot;</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Diet Management Modal */}
      {showSpecialDietModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manage Special Diets</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecialDietModal(false);
                    handleCancelEditSpecialDiet();
                  }}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Add/Edit Form */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  {editingSpecialDietId ? 'Edit Special Diet' : 'Add New Special Diet'}
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingSpecialDietId ? editingSpecialDietName : newSpecialDietName}
                    onChange={e => {
                      if (editingSpecialDietId) {
                        setEditingSpecialDietName(e.target.value);
                      } else {
                        setNewSpecialDietName(e.target.value);
                      }
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        if (editingSpecialDietId) {
                          handleEditSpecialDiet();
                        } else {
                          handleAddSpecialDiet();
                        }
                      }
                    }}
                    className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter special diet name"
                  />
                  {editingSpecialDietId ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEditSpecialDiet}
                        disabled={!editingSpecialDietName.trim() || savingSpecialDiet}
                        className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {savingSpecialDiet ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditSpecialDiet}
                        disabled={savingSpecialDiet}
                        className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddSpecialDiet}
                      disabled={!newSpecialDietName.trim() || savingSpecialDiet}
                      className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {savingSpecialDiet ? 'Adding...' : 'Add'}
                    </button>
                  )}
                </div>
              </div>

              {/* Existing Special Diets List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Special Diets</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {loadingSpecialDiets ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                  ) : specialDiets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No special diets added yet. Add your first option above.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {specialDiets.map((sdItem, idx) => (
                        <div key={sdItem.id} className={`p-4 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">{sdItem.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Created: {new Date(sdItem.createdAt).toLocaleDateString()}, 
                              Updated: {new Date(sdItem.updatedAt).toLocaleDateString()})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditSpecialDiet(sdItem)}
                              disabled={!!editingSpecialDietId}
                              className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpecialDiet(sdItem.id)}
                              disabled={!!editingSpecialDietId}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Special Diet Delete Confirmation Modal */}
      {showSpecialDietDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Special Diet
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{specialDiets.find(d => d.id === specialDietToDelete)?.name}&quot;</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteSpecialDietCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSpecialDietConfirm}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium cursor-pointer"
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
