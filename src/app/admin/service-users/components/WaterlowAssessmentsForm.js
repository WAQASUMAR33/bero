'use client';

import { useEffect, useState } from 'react';

export default function WaterlowAssessmentsForm({ serviceSeekerId, serviceUserName, onNotification }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    assessedOn: '', currentWeightKg: '', heightM: '', previousWeightKg: '',
    continence: '', skinType: '', mobility: '', specialSurgeryTrauma: '',
    specialTissue: [], specialNeuro: [], specialMedication: [], photos: [],
    score: '', riskLevel: '', conductedBy: ''
  });

  const continenceOpts = ['Dry', 'Occasional', 'Catheter', 'Incontinent'];
  const skinTypeOpts = ['Healthy', 'Red areas', 'Broken skin', 'Ulcer present'];
  const mobilityOpts = ['Fully mobile', 'Restless', 'Walks with help', 'Chairbound', 'Bedbound'];
  const surgeryTraumaOpts = ['None', 'Within last month', 'Major within last month'];
  const tissueOpts = ['Anaemia = Hb < 8', 'Multiple organ failure/terminal cachexia', 'Peripheral vascular disease', 'Single organ failure e.g. cardiac, renal, respiratory', 'Smoking'];
  const neuroOpts = ['CVA', 'Diabetes', 'motor', 'MS', 'paraplegia', 'sensory'];
  const medicationOpts = ['Anti-Inflammatory', 'Cytotoxic', 'High Dose Steroids', 'Long Term Steroids'];

  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => { try { const res = await fetch('/api/users'); if (res.ok) { setStaff(await res.json()); } } catch (e) { console.error(e); } };

  const fetchRows = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setRows(await res.json()); } } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const formatDate = (s) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return s || '-' } };

  const openAdd = () => { setFormData({ assessedOn: '', currentWeightKg: '', heightM: '', previousWeightKg: '', continence: '', skinType: '', mobility: '', specialSurgeryTrauma: '', specialTissue: [], specialNeuro: [], specialMedication: [], photos: [], score: '', riskLevel: '', conductedBy: '' }); setShowModal(true); };

  const calculateScore = () => {
    let score = 0;

    // 1. BMI Score (Waterlow: >30=+2, >25=+1, 20-25=0, <20=+3)
    const bmi = formData.currentWeightKg && formData.heightM ? (parseFloat(formData.currentWeightKg) / (parseFloat(formData.heightM) ** 2)) : null;
    if (bmi !== null) {
      if (bmi > 30) score += 2;
      else if (bmi >= 25) score += 1;
      else if (bmi >= 20) score += 0;
      else score += 3;
    }

    // 2. Weight Loss (Waterlow doesn't strictly have a "recent weight loss" score in the same way MUST does, 
    // but often includes "Unplanned Weight Loss" in Malnutrition section. 
    // We'll calculate 0.5-5kg = 1, >5kg = 2 if we follow general malnutrition risks, 
    // but strictly Waterlow uses specific Tissue Malnutrition categories.
    // Given the form has "Previous Weight" input, we'll keep a simple check or rely on the "Tissue" dropdowns.
    // For now, let's rely on the Tissue Malnutrition dropdowns as they map to Waterlow scores better.)
    // However, to keep existing field relevance:
    const weightLoss = formData.previousWeightKg && formData.currentWeightKg ? (parseFloat(formData.previousWeightKg) - parseFloat(formData.currentWeightKg)) : 0;
    if (weightLoss > 5) score += 2; // Approximating "Unplanned weight loss" risk

    // 3. Continence
    const continenceMap = { 'Dry': 0, 'Occasional': 1, 'Catheter': 0, 'Incontinent': 3 };
    score += continenceMap[formData.continence] || 0;

    // 4. Skin Type
    const skinMap = { 'Healthy': 0, 'Red areas': 2, 'Broken skin': 3, 'Ulcer present': 3 };
    score += skinMap[formData.skinType] || 0;

    // 5. Mobility
    const mobilityMap = { 'Fully mobile': 0, 'Restless': 1, 'Walks with help': 3, 'Chairbound': 5, 'Bedbound': 4 };
    score += mobilityMap[formData.mobility] || 0;

    // 6. Surgery/Trauma
    const surgeryMap = { 'None': 0, 'Within last month': 5, 'Major within last month': 8 };
    score += surgeryMap[formData.specialSurgeryTrauma] || 0;

    // 7. Special - Tissue
    const tissueMap = {
      'Anaemia = Hb < 8': 2,
      'Multiple organ failure/terminal cachexia': 8,
      'Peripheral vascular disease': 5,
      'Single organ failure e.g. cardiac, renal, respiratory': 5,
      'Smoking': 1
    };
    (formData.specialTissue || []).forEach(item => score += (tissueMap[item] || 0));

    // 8. Special - Neuro
    const neuroMap = { 'CVA': 4, 'Diabetes': 4, 'motor': 4, 'MS': 4, 'paraplegia': 6, 'sensory': 4 };
    (formData.specialNeuro || []).forEach(item => score += (neuroMap[item] || 0));

    // 9. Special - Medication
    const medsMap = { 'Anti-Inflammatory': 4, 'Cytotoxic': 4, 'High Dose Steroids': 4, 'Long Term Steroids': 4 };
    (formData.specialMedication || []).forEach(item => score += (medsMap[item] || 0));

    // Risk Level
    let riskLevel = 'Low Risk';
    if (score >= 20) riskLevel = 'Very High Risk';
    else if (score >= 15) riskLevel = 'High Risk';
    else if (score >= 10) riskLevel = 'At Risk';

    setFormData(prev => ({ ...prev, score: String(score), riskLevel }));
  };

  const save = async () => { setSaving(true); try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) }); if (res.ok) { await fetchRows(); setShowModal(false); if (onNotification) onNotification({ show: true, message: 'Waterlow assessment saved.', type: 'success' }); } else { const err = await res.json(); if (onNotification) onNotification({ show: true, message: err.error || 'Failed to save.', type: 'error' }); } } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to save.', type: 'error' }); } finally { setSaving(false); } };

  const deleteRow = async (id) => { setSaving(true); try { const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/waterlow?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); await fetchRows(); if (onNotification) onNotification({ show: true, message: 'Deleted.', type: 'success' }); } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Delete failed.', type: 'error' }); } finally { setSaving(false); } };

  const toggleInList = (key, value) => {
    setFormData(prev => { const set = new Set(prev[key] || []); if (set.has(value)) set.delete(value); else set.add(value); return { ...prev, [key]: Array.from(set) }; });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (onNotification) onNotification({ show: true, message: 'Please select an image file', type: 'error' });
      return;
    }
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
            setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), data.fileUrl] }));
            if (onNotification) onNotification({ show: true, message: 'Image uploaded successfully', type: 'success' });
          } else {
            console.error(data.error);
            if (onNotification) onNotification({ show: true, message: data.error || 'Upload failed', type: 'error' });
          }
        } catch (err) {
          console.error(err);
          if (onNotification) onNotification({ show: true, message: 'Upload failed', type: 'error' });
        } finally {
          setUploadingImage(false);
          // Reset input
          e.target.value = null;
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setUploadingImage(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => {
      const newPhotos = [...(prev.photos || [])];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pressure Sore/Ulcer Waterlow</h2>
          <button type="button" onClick={openAdd} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="p-6">

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">No assessments found</p>
            <p className="text-sm text-gray-400">Click Add to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assessed On</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.assessedOn)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.score ?? '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.riskLevel || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(r.updatedAt)}</td>
                    <td className="py-3 px-4"><button type="button" onClick={() => deleteRow(r.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add MUST Risk Assessment</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Assessed On</label><input type="date" value={formData.assessedOn} onChange={e => setFormData(prev => ({ ...prev, assessedOn: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Current Weight (kg)</label><input type="number" step="0.01" value={formData.currentWeightKg} onChange={e => setFormData(prev => ({ ...prev, currentWeightKg: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Most recent within 7 days" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Height (meters)</label><input type="number" step="0.01" value={formData.heightM} onChange={e => setFormData(prev => ({ ...prev, heightM: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Pulled from Health section" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Previous Weight (3-6 Months Ago)</label><input type="number" step="0.01" value={formData.previousWeightKg} onChange={e => setFormData(prev => ({ ...prev, previousWeightKg: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Most recent between 3-6 months" /></div>

                <div><label className="block text-sm text-gray-600 mb-1">Continence</label><select value={formData.continence} onChange={e => setFormData(prev => ({ ...prev, continence: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{continenceOpts.map(o => (<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Skin Type Visual Risk Area</label><select value={formData.skinType} onChange={e => setFormData(prev => ({ ...prev, skinType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{skinTypeOpts.map(o => (<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Mobility</label><select value={formData.mobility} onChange={e => setFormData(prev => ({ ...prev, mobility: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{mobilityOpts.map(o => (<option key={o}>{o}</option>))}</select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Special Risks Surgery/Trauma</label><select value={formData.specialSurgeryTrauma} onChange={e => setFormData(prev => ({ ...prev, specialSurgeryTrauma: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{surgeryTraumaOpts.map(o => (<option key={o}>{o}</option>))}</select></div>

                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Tissue Malnutrition</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{tissueOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialTissue.includes(o)} onChange={() => toggleInList('specialTissue', o)} /><span>{o}</span></label>))}</div></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Neurological Deficit</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{neuroOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialNeuro.includes(o)} onChange={() => toggleInList('specialNeuro', o)} /><span>{o}</span></label>))}</div></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-2">Special Risks Medication</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-56 overflow-y-auto">{medicationOpts.map(o => (<label key={o} className="text-sm text-gray-700 flex items-center space-x-2"><input type="checkbox" checked={formData.specialMedication.includes(o)} onChange={() => toggleInList('specialMedication', o)} /><span>{o}</span></label>))}</div></div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Pictures</label>
                  <div className="space-y-2">
                    {formData.photos?.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between border p-2 rounded">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs">{url.split('/').pop()}</a>
                        <button type="button" onClick={() => removePhoto(idx)} className="text-red-500 hover:text-red-700">×</button>
                      </div>
                    ))}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" disabled={uploadingImage} />
                    {uploadingImage && <p className="text-xs text-gray-500">Uploading...</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between space-x-3">
              <button type="button" onClick={calculateScore} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all font-medium">Calculate</button>
              <div className="flex items-center space-x-3">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
                <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 mt-2">We use calculation method defined by <a href="https://www.bapen.org.uk" className="text-[#224fa6]" target="_blank" rel="noreferrer">www.bapen.org.uk</a></div>
    </div>
  );
}


