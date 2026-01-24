'use client';

import { useEffect, useState } from 'react';

export default function ConfidentialNotesForm({ serviceSeekerId, currentStaffName = '', onNotification }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [formData, setFormData] = useState({ noteDate: '', notes: '', pictureUrl: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const formatDate = (s) => {
    if (!s) return '-';
    try { const d = new Date(s); return d.toISOString().substring(0, 10); } catch { return s || '-' }
  };

  const formatDateDisplay = (s) => {
    if (!s) return '-';
    try { const d = new Date(s); return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return s || '-' }
  };

  useEffect(() => { fetchNotes(); }, [serviceSeekerId]);

  const fetchNotes = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/confidential-notes`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setNotes(data || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    setFormData({ noteDate: '', notes: '', pictureUrl: '' });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/confidential-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ noteDate: formData.noteDate || new Date().toISOString().substring(0, 10), notes: formData.notes, pictureUrl: null, staffName: currentStaffName || null })
      });
      if (res.ok) { await fetchNotes(); setShowModal(false); if (onNotification) onNotification({ show: true, message: 'Note added.', type: 'success' }); }
      else { const err = await res.json(); if (onNotification) onNotification({ show: true, message: err.error || 'Failed to add note.', type: 'error' }); }
    } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to add note.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/confidential-notes?id=${noteToDelete}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { await fetchNotes(); setShowDeleteConfirm(false); setNoteToDelete(null); if (onNotification) onNotification({ show: true, message: 'Note deleted.', type: 'success' }); }
      else { const err = await res.json(); if (onNotification) onNotification({ show: true, message: err.error || 'Failed to delete note.', type: 'error' }); }
    } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to delete note.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (onNotification) onNotification({ show: true, message: 'Please select an image file', type: 'error' });
      return;
    }
    setSelectedFile(file);
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ file: base64Data }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.fileUrl) {
            setFormData(prev => ({ ...prev, pictureUrl: data.fileUrl }));
            if (onNotification) onNotification({ show: true, message: 'Image uploaded successfully', type: 'success' });
          } else {
            console.error(data.error);
            if (onNotification) onNotification({ show: true, message: data.error || 'Upload failed', type: 'error' });
            setSelectedFile(null);
          }
        } catch (err) {
          console.error(err);
          if (onNotification) onNotification({ show: true, message: 'Upload failed', type: 'error' });
          setSelectedFile(null);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setUploadingImage(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Confidential Notes - Management Only</h2>
      </div>

      <div className="p-6">

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">No notes found</p>
            <p className="text-sm text-gray-400">Click the Add button to add a note.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notes</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pictures</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n, idx) => (
                  <tr key={n.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDateDisplay(n.noteDate)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{n.staffName || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 whitespace-pre-wrap">{n.notes || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {n.pictureUrl ? (
                        <a href={n.pictureUrl} target="_blank" rel="noopener noreferrer" className="text-[#224fa6] hover:underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDateDisplay(n.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDateDisplay(n.updatedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <button type="button" onClick={() => { setNoteToDelete(n.id); setShowDeleteConfirm(true); }} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Select a note to delete</span>
          </div>
          <button type="button" onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Confidential Note</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input type="date" value={formData.noteDate} onChange={e => setFormData(prev => ({ ...prev, noteDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={4} placeholder="Enter notes" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Pictures</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" disabled={uploadingImage} />
                  {uploadingImage && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  {formData.pictureUrl && <p className="text-xs text-green-600 mt-1">Image uploaded: {selectedFile?.name || 'File'}</p>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <h3 className="text-xl font-semibold">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setNoteToDelete(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70">{saving ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


