'use client';

import { useEffect, useState } from 'react';

export default function DocumentsForm({ serviceSeekerId, onNotification }) {
  const defaultDocTypes = [
    'Advanced Care Plan',
    'Blood Results',
    'Commissioning Body Report',
    'Community Nurse Report',
    'Competency',
    'DNAR - Do Not Attempt Resuscitation',
    'Enduring Power of Attorney',
    'Lasting Power of Attorney',
    'MCA',
    'Medical Card',
    'Meds',
    'My Photos',
    'Occupational Therapy Report',
    'Outreach (Positive Behaviour Support Plan)',
    'Psychiatry Report',
    'Psychology Report',
    'Speech and Language Therapy Report',
    'Transfer of care form',
  ];

  const [docTypes, setDocTypes] = useState(() => {
    if (typeof window === 'undefined') return ['All', ...defaultDocTypes];
    try {
      const raw = localStorage.getItem('documentTypes');
      const parsed = raw ? JSON.parse(raw) : null;
      const list = parsed && Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultDocTypes;
      return ['All', ...list];
    } catch { return ['All', ...defaultDocTypes]; }
  });

  const [showManageTypes, setShowManageTypes] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('');

  useEffect(() => { fetchDocuments(); }, [serviceSeekerId]);

  const persistTypes = (types) => {
    setDocTypes(['All', ...types]);
    try { localStorage.setItem('documentTypes', JSON.stringify(types)); } catch { }
  };

  const fetchDocuments = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/documents`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setDocuments(data || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (s) => {
    if (!s) return '-';
    try { const d = new Date(s); return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return s || '-' }
  };

  const handleChooseFile = () => {
    const input = document.getElementById('docUploadInput');
    if (input) input.click();
  };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(file);
    setUploadDocType('');
  };

  const handleUpload = async () => {
    if (!uploadingFile) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64DataUri = reader.result;

          // Upload file to external service
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ file: base64DataUri })
          });

          const uploadData = await uploadRes.json();
          let fileUrl = null;

          if (uploadRes.ok && uploadData.success) {
            fileUrl = uploadData.fileUrl;
          } else {
            if (onNotification) onNotification({
              show: true,
              message: uploadData.error || 'Failed to upload file. Document metadata will be saved without file.',
              type: 'warning'
            });
          }

          // Save document with file URL
          const res = await fetch(`/api/service-seekers/${serviceSeekerId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              docType: uploadDocType || 'Other',
              name: uploadingFile.name,
              fileUrl: fileUrl
            })
          });

          if (res.ok) {
            await fetchDocuments();
            setUploadingFile(null);
            setUploadDocType('');
            if (onNotification) onNotification({
              show: true,
              message: fileUrl ? 'Document uploaded and saved successfully.' : 'Document saved (file upload failed).',
              type: fileUrl ? 'success' : 'warning'
            });
          } else {
            const err = await res.json();
            if (onNotification) onNotification({ show: true, message: err.error || 'Failed to save document.', type: 'error' });
          }
        } catch (error) {
          console.error('Upload error:', error);
          if (onNotification) onNotification({ show: true, message: 'Failed to upload file.', type: 'error' });
        } finally {
          setSaving(false);
        }
      };

      reader.onerror = () => {
        if (onNotification) onNotification({ show: true, message: 'Failed to read file.', type: 'error' });
        setSaving(false);
      };

      reader.readAsDataURL(uploadingFile);
    } catch (e) {
      console.error(e);
      if (onNotification) onNotification({ show: true, message: 'Failed to save document.', type: 'error' });
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/documents?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { await fetchDocuments(); if (onNotification) onNotification({ show: true, message: 'Document deleted.', type: 'success' }); }
    } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to delete document.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const filteredDocs = documents.filter(d => selectedType === 'All' ? true : d.docType === selectedType);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Documents</h2>
      </div>

      <div className="p-6">

        {/* Filter Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-64 border rounded-lg px-3 py-2 text-gray-900">
                {docTypes.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <button type="button" title="Manage types" onClick={() => setShowManageTypes(true)} className="mt-6 h-10 w-10 flex items-center justify-center border rounded-lg text-gray-700 bg-white hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4h2m7 0h-2m-3 0h-2M7 4H5m6 4v12m-4-4h8" /></svg>
            </button>
          </div>

          <div>
            <button type="button" onClick={handleChooseFile} className="px-4 py-2 bg-[#224fa6] text-white rounded-lg hover:bg-[#224fa6]/90">Upload Document</button>
            <input id="docUploadInput" type="file" className="hidden" onChange={onFileSelected} />
          </div>
        </div>

        {/* Upload selected file row */}
        {uploadingFile && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-700 mb-2">Selected: {uploadingFile.name}</p>
                <label className="block text-sm text-gray-600 mb-1">Document Type</label>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                  <option value="">Please Select</option>
                  {docTypes.filter(t => t !== 'All').map(t => (<option key={t} value={t}>{t}</option>))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button type="button" onClick={() => { setUploadingFile(null); setUploadDocType(''); }} className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="button" disabled={saving || !uploadDocType} onClick={handleUpload} className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">No documents found</p>
            <p className="text-sm text-gray-400">Use the Upload button to add a document.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d, idx) => (
                  <tr key={d.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{d.docType}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {d.fileUrl ? (
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#224fa6] hover:underline" title="Open file">
                          {d.name}
                        </a>
                      ) : (
                        d.name
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(d.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(d.updatedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {d.fileUrl ? (
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#224fa6] hover:text-[#1a3d85] text-sm font-medium" download>Download</a>
                        ) : (
                          <button type="button" disabled className="text-[#224fa6]/50 text-sm" title="Download not yet available">Download</button>
                        )}
                        <button type="button" onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Manage Types Modal */}
        {showManageTypes && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              {/* Blue Header */}
              <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Manage Document Types</h3>
                  <button type="button" onClick={() => setShowManageTypes(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {docTypes.filter(t => t !== 'All').map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-800">{t}</span>
                    <button type="button" onClick={() => { const next = docTypes.filter(x => x !== t && x !== 'All'); persistTypes(next); }} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input type="text" id="newDocTypeInput" placeholder="Add new type" className="flex-1 border rounded-lg px-3 py-2 text-gray-900" />
                  <button type="button" onClick={() => { const el = document.getElementById('newDocTypeInput'); const val = (el?.value || '').trim(); if (!val) return; const next = Array.from(new Set([...docTypes.filter(t => t !== 'All'), val])); persistTypes(next); el.value = ''; }} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


