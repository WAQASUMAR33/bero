'use client';

import { useEffect, useState, useRef } from 'react';

// Helper to parse comma-separated or JSON string or array into string array
const parseMultiSelectValues = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

function MultiSelectDropdown({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Please select',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    (opt.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (name) => {
    if (disabled) return;
    if (selectedValues.includes(name)) {
      onChange(selectedValues.filter(v => v !== name));
    } else {
      onChange([...selectedValues, name]);
    }
  };

  const handleRemoveOne = (e, name) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter(v => v !== name));
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const allNames = Array.from(new Set([...selectedValues, ...filteredOptions.map(o => o.name)]));
    onChange(allNames);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev);
        }}
        className={`w-full min-h-[42px] border rounded-lg px-3 py-1.5 bg-white flex items-center justify-between gap-2 cursor-pointer transition-colors ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'hover:border-gray-400 focus-within:ring-2 focus-within:ring-[#224fa6]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            selectedValues.map(val => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-[#224fa6] border border-blue-200"
              >
                <span>{val}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveOne(e, val)}
                  className="text-blue-500 hover:text-blue-800 leading-none focus:outline-none cursor-pointer"
                  title={`Remove ${val}`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
              title="Clear all"
            >
              ×
            </button>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-40 overflow-hidden animate-in fade-in duration-150">
          {/* Search bar & quick actions */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#224fa6]"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center justify-between mt-1.5 px-0.5 text-[11px] text-gray-500">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#224fa6] hover:underline cursor-pointer"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-red-600 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">No options found</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt.name);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-medium text-blue-900' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(opt.name)}
                      className="w-4 h-4 text-[#224fa6] border-gray-300 rounded focus:ring-[#224fa6] mr-2.5"
                    />
                    <span className="flex-1 truncate">{opt.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietForm({ diet, setField, onSave, saving }) {
  // Main Diets State
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

  // Fluids State
  const [fluids, setFluids] = useState([]);
  const [showFluidModal, setShowFluidModal] = useState(false);
  const [newFluidName, setNewFluidName] = useState('');
  const [editingFluidId, setEditingFluidId] = useState(null);
  const [editingFluidName, setEditingFluidName] = useState('');
  const [loadingFluids, setLoadingFluids] = useState(false);
  const [savingFluid, setSavingFluid] = useState(false);
  const [showFluidDeleteConfirm, setShowFluidDeleteConfirm] = useState(false);
  const [fluidToDelete, setFluidToDelete] = useState(null);

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

  const fetchFluids = async () => {
    setLoadingFluids(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fluids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFluids(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFluids(false);
    }
  };

  useEffect(() => {
    fetchDiets();
    fetchSpecialDiets();
    fetchFluids();
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
        const oldName = diets.find(d => d.id === editingDietId)?.name;
        setDiets(prev => prev.map(d => d.id === editingDietId ? data : d).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingDietId(null);
        setEditingDietName('');
        
        // Update selection if the renamed diet was selected
        const currentSelected = parseMultiSelectValues(diet.mainDiet);
        if (oldName && currentSelected.includes(oldName)) {
          const updated = currentSelected.map(n => n === oldName ? data.name : n);
          setField('mainDiet', updated.join(', '));
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
        
        // Remove from selected list if present
        const currentSelected = parseMultiSelectValues(diet.mainDiet);
        if (deletedDiet && currentSelected.includes(deletedDiet.name)) {
          const updated = currentSelected.filter(n => n !== deletedDiet.name);
          setField('mainDiet', updated.join(', '));
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
        const oldName = specialDiets.find(d => d.id === editingSpecialDietId)?.name;
        setSpecialDiets(prev => prev.map(d => d.id === editingSpecialDietId ? data : d).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingSpecialDietId(null);
        setEditingSpecialDietName('');

        // Update selection if the renamed special diet was selected
        const currentSelected = parseMultiSelectValues(diet.specialDiet);
        if (oldName && currentSelected.includes(oldName)) {
          const updated = currentSelected.map(n => n === oldName ? data.name : n);
          setField('specialDiet', updated.join(', '));
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

        // Remove from selected list if present
        const currentSelected = parseMultiSelectValues(diet.specialDiet);
        if (deletedSpecialDiet && currentSelected.includes(deletedSpecialDiet.name)) {
          const updated = currentSelected.filter(n => n !== deletedSpecialDiet.name);
          setField('specialDiet', updated.join(', '));
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

  // Fluids Handlers
  const handleAddFluid = async () => {
    if (!newFluidName.trim()) return;
    setSavingFluid(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fluids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newFluidName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setFluids(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFluidName('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to add fluid' }));
        console.error(err?.error || 'Failed to add fluid');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingFluid(false);
    }
  };

  const handleEditFluid = async () => {
    if (!editingFluidName.trim() || !editingFluidId) return;
    setSavingFluid(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fluids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingFluidId, name: editingFluidName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const oldName = fluids.find(f => f.id === editingFluidId)?.name;
        setFluids(prev => prev.map(f => f.id === editingFluidId ? data : f).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingFluidId(null);
        setEditingFluidName('');

        // Update selection if the renamed fluid was selected
        const currentSelected = parseMultiSelectValues(diet.fluids);
        if (oldName && currentSelected.includes(oldName)) {
          const updated = currentSelected.map(n => n === oldName ? data.name : n);
          setField('fluids', updated.join(', '));
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update fluid' }));
        console.error(err?.error || 'Failed to update fluid');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingFluid(false);
    }
  };

  const handleDeleteFluid = (id) => {
    setFluidToDelete(id);
    setShowFluidDeleteConfirm(true);
  };

  const handleDeleteFluidCancel = () => {
    setShowFluidDeleteConfirm(false);
    setFluidToDelete(null);
  };

  const handleDeleteFluidConfirm = async () => {
    if (!fluidToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/fluids?id=${fluidToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const deletedFluid = fluids.find(f => f.id === fluidToDelete);
        setFluids(prev => prev.filter(f => f.id !== fluidToDelete));

        // Remove from selected list if present
        const currentSelected = parseMultiSelectValues(diet.fluids);
        if (deletedFluid && currentSelected.includes(deletedFluid.name)) {
          const updated = currentSelected.filter(n => n !== deletedFluid.name);
          setField('fluids', updated.join(', '));
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete fluid' }));
        console.error(err?.error || 'Failed to delete fluid');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowFluidDeleteConfirm(false);
      setFluidToDelete(null);
    }
  };

  const handleStartEditFluid = (item) => {
    setEditingFluidId(item.id);
    setEditingFluidName(item.name);
    setNewFluidName('');
  };

  const handleCancelEditFluid = () => {
    setEditingFluidId(null);
    setEditingFluidName('');
    setNewFluidName('');
  };

  // Selected values array derivations
  const selectedMainDiets = parseMultiSelectValues(diet.mainDiet);
  const selectedSpecialDiets = parseMultiSelectValues(diet.specialDiet);
  const selectedFluids = parseMultiSelectValues(diet.fluids);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
        {/* Blue Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Diet & Hydration</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Food Allergies</label>
              <textarea
                value={diet.foodAllergies || ''}
                onChange={e => setField('foodAllergies', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900"
                rows={3}
                placeholder="None"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Nil By Mouth</label>
              <select
                value={diet.nilByMouth || ''}
                onChange={e => setField('nilByMouth', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 min-h-[42px]"
              >
                <option value="">Please Select</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>

            {/* Main Diet Multi-Select */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Main Diet</label>
              <div className="flex items-start space-x-2">
                <MultiSelectDropdown
                  options={diets}
                  selectedValues={selectedMainDiets}
                  onChange={(newVals) => setField('mainDiet', newVals.join(', '))}
                  placeholder="Select main diets..."
                  disabled={loadingDiets}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingDietId(null);
                    setEditingDietName('');
                    setNewDietName('');
                    setShowDietModal(true);
                    fetchDiets();
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#224fa6] font-bold transition-colors cursor-pointer shrink-0"
                  title="Manage Main Diets"
                >
                  +
                </button>
              </div>
            </div>

            {/* Special Diets Multi-Select */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Special Diets</label>
              <div className="flex items-start space-x-2">
                <MultiSelectDropdown
                  options={specialDiets}
                  selectedValues={selectedSpecialDiets}
                  onChange={(newVals) => setField('specialDiet', newVals.join(', '))}
                  placeholder="Select special diets..."
                  disabled={loadingSpecialDiets}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingSpecialDietId(null);
                    setEditingSpecialDietName('');
                    setNewSpecialDietName('');
                    setShowSpecialDietModal(true);
                    fetchSpecialDiets();
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#224fa6] font-bold transition-colors cursor-pointer shrink-0"
                  title="Manage Special Diets"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fluids Multi-Select */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fluids</label>
              <div className="flex items-start space-x-2">
                <MultiSelectDropdown
                  options={fluids}
                  selectedValues={selectedFluids}
                  onChange={(newVals) => setField('fluids', newVals.join(', '))}
                  placeholder="Select fluids..."
                  disabled={loadingFluids}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingFluidId(null);
                    setEditingFluidName('');
                    setNewFluidName('');
                    setShowFluidModal(true);
                    fetchFluids();
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#224fa6] font-bold transition-colors cursor-pointer shrink-0"
                  title="Manage Fluids"
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
                    onKeyDown={e => {
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
                            <span className="text-sm font-medium text-gray-900">{dietItem.name}</span>
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
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
                    onKeyDown={e => {
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
                            <span className="text-sm font-medium text-gray-900">{sdItem.name}</span>
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
                  type="button"
                  onClick={handleDeleteSpecialDietCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
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

      {/* Fluids Management Modal */}
      {showFluidModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manage Fluids</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowFluidModal(false);
                    handleCancelEditFluid();
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
                  {editingFluidId ? 'Edit Fluid Type' : 'Add New Fluid Type'}
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingFluidId ? editingFluidName : newFluidName}
                    onChange={e => {
                      if (editingFluidId) {
                        setEditingFluidName(e.target.value);
                      } else {
                        setNewFluidName(e.target.value);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingFluidId) {
                          handleEditFluid();
                        } else {
                          handleAddFluid();
                        }
                      }
                    }}
                    className="flex-1 border rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Enter fluid name (e.g. Water, Orange Juice)"
                  />
                  {editingFluidId ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEditFluid}
                        disabled={!editingFluidName.trim() || savingFluid}
                        className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {savingFluid ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditFluid}
                        disabled={savingFluid}
                        className="px-4 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddFluid}
                      disabled={!newFluidName.trim() || savingFluid}
                      className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {savingFluid ? 'Adding...' : 'Add'}
                    </button>
                  )}
                </div>
              </div>

              {/* Existing Fluids List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Fluid Types</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {loadingFluids ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                  ) : fluids.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No fluids added yet. Add your first option above.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {fluids.map((fluidItem, idx) => (
                        <div key={fluidItem.id} className={`p-4 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{fluidItem.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Created: {new Date(fluidItem.createdAt).toLocaleDateString()}, 
                              Updated: {new Date(fluidItem.updatedAt).toLocaleDateString()})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditFluid(fluidItem)}
                              disabled={!!editingFluidId}
                              className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFluid(fluidItem.id)}
                              disabled={!!editingFluidId}
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

      {/* Fluid Delete Confirmation Modal */}
      {showFluidDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Fluid Type
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{fluids.find(f => f.id === fluidToDelete)?.name}&quot;</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleDeleteFluidCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFluidConfirm}
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
