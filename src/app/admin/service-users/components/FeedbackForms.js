'use client';

import { useEffect, useMemo, useState } from 'react';

const options = [
  { key: 'CLIENT_REVIEW', name: 'Client Review Form' },
  { key: 'COMPLETED', name: 'Completed' },
  { key: 'QUALITY_MONITORING', name: 'Quality monitoring' },
  { key: 'SERVICE_USER_FEEDBACK', name: 'Service User Feedback Form' },
  { key: 'SUPERVISION', name: 'Supervision' },
];

export default function FeedbackForms({ serviceSeekerId, serviceUserName, onNotification }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({ name: '', lastAssessed: '', score: '', conductedBy: '', data: {} });

  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setStaff(await res.json()); }
    } catch (e) { console.error(e); }
  };

  const fetchRows = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/feedback`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setRows(await res.json()); } } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const formatDate = (s) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return s || '-' } };

  const openAdd = () => { setFormData({ name: '', lastAssessed: '', score: '', conductedBy: '', data: {} }); setShowModal(true); };

  const save = async () => { setSaving(true); try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) }); if (res.ok) { await fetchRows(); setShowModal(false); if (onNotification) onNotification({ show: true, message: 'Feedback saved.', type: 'success' }); } else { const err = await res.json(); if (onNotification) onNotification({ show: true, message: err.error || 'Failed to save.', type: 'error' }); } } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to save.', type: 'error' }); } finally { setSaving(false); } };

  const deleteRow = async (id) => { setSaving(true); try { const token = localStorage.getItem('token'); await fetch(`/api/service-seekers/${serviceSeekerId}/feedback?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); await fetchRows(); if (onNotification) onNotification({ show: true, message: 'Deleted.', type: 'success' }); } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Delete failed.', type: 'error' }); } finally { setSaving(false); } };

  const is = (key) => formData.name === options.find(o => o.key === key)?.name;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Feedback Forms</h2>
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
            <p className="text-sm text-gray-500 mb-1">No forms found</p>
            <p className="text-sm text-gray-400">Click Add to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Assessed</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Conducted By</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatDate(r.lastAssessed)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.score || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.conductedBy || '-'}</td>
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
                <h3 className="text-xl font-semibold">Assessment</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-2xl leading-none transition-colors">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Service User</label>
                  <input type="text" value={serviceUserName || ''} disabled className="w-full border rounded-lg px-3 py-2 text-gray-500 bg-gray-100" />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <select value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                      <option value="">Please Select</option>
                      {options.map(o => (<option key={o.key} value={o.name}>{o.name}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Assessed</label>
                  <input type="date" value={formData.lastAssessed} onChange={e => setFormData(prev => ({ ...prev, lastAssessed: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>

                {is('CLIENT_REVIEW') && (
                  <>
                    <div><label className="block text-sm text-gray-600 mb-1">Client Name</label><input type="text" value={formData.data.clientName || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, clientName: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Date</label><input type="date" value={formData.data.clientDate || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, clientDate: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                    <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Please select relevant drop down</h4></div>
                    {['Friendly', 'Approachable', 'Have a can-do attitude', 'Deliver person centred care', 'Deliver a strength based approach (focus on what the individual can do rather than what they can\'t do)', 'Competant', 'Presentable'].map(key => (
                      <div key={key}><label className="block text-sm text-gray-600 mb-1">{key}</label><select value={formData.data[key] || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, [key]: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select></div>
                    ))}
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">In what ways do you think we can improve our service?</label><textarea value={formData.data.improve || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, improve: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What’s working well?</label><textarea value={formData.data.workingWell || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, workingWell: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Any other comments?</label><textarea value={formData.data.otherComments || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, otherComments: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Client Signature</label><button type="button" className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center text-sm text-gray-600" onClick={() => alert('Signature capture will be implemented later')}>Tap to sign</button></div>
                  </>
                )}

                {(is('COMPLETED') || is('QUALITY_MONITORING') || is('SUPERVISION')) && (
                  <>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What is the risk?</label><textarea value={formData.data.whatIsRisk || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, whatIsRisk: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Risk before intervention?</label><select value={formData.data.riskBefore || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, riskBefore: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Low</option><option>Medium</option><option>High</option></select></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Who is at risk?</label><input type="text" value={formData.data.whoIsAtRisk || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, whoIsAtRisk: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Is the risk historical?</label><select value={formData.data.isHistorical || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, isHistorical: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select></div>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What could happen?</label><textarea value={formData.data.whatCouldHappen || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, whatCouldHappen: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Action to take by staff?</label><textarea value={formData.data.actionToTake || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, actionToTake: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Risk occurring following implementation of control measures?</label><select value={formData.data.riskAfter || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, riskAfter: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Low</option><option>Medium</option><option>High</option></select></div>
                  </>
                )}

                {is('SERVICE_USER_FEEDBACK') && (
                  <>
                    <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Your Happiness</h4></div>
                    {['How happy are you with the way you are cared for?', 'How happy are you with the way you are listened to?', 'How happy are you with the way you are understood?', 'How happy are you with the way you are spoken to?', 'How happy are you with the way you are respected?'].map(q => (
                      <div key={q}><label className="block text-sm text-gray-600 mb-1">{q}</label><select value={formData.data[q] || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, [q]: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Very happy</option><option>Happy</option><option>Neutral</option><option>Unhappy</option><option>Very unhappy</option></select></div>
                    ))}
                    <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Your Carer</h4></div>
                    {['Your carer was was on time?', 'Your carer was easy to contact?', 'Your carer involved you in decisions made about you?', 'Your carer was open and honest about your options?'].map(q => (
                      <div key={q}><label className="block text-sm text-gray-600 mb-1">{q}</label><select value={formData.data[q] || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, [q]: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Always</option><option>Usually</option><option>Sometimes</option><option>Rarely</option><option>Never</option></select></div>
                    ))}
                    <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Your Food</h4></div>
                    {['How happy are you with the choice of food provided?', 'How happy are you with the variety of fooed provided?', 'How happy are you with the amount of food provided?', 'How happy are you with the efforts made to satisfy your individual requirement (including any religious or cultural requirements)?', 'How happy are you with the way menus are planned?'].map(q => (
                      <div key={q}><label className="block text-sm text-gray-600 mb-1">{q}</label><select value={formData.data[q] || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, [q]: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Very happy</option><option>Happy</option><option>Neutral</option><option>Unhappy</option><option>Very unhappy</option></select></div>
                    ))}
                    <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Your Day to Day</h4></div>
                    {['How happy are you with the arrangements you have for getting up and going to bed?', 'How happy are you with the arrangements for your personal care (E.G. for washing, bathing, going to the toilet, etc)?', 'How happy are you with the arrangements for cleaning and tidying your room or flat?', 'How happy are you with the social activities provided or arranged?', 'How happy are you with the efforts to help you keep up with your personal interests and hobbies?'].map(q => (
                      <div key={q}><label className="block text-sm text-gray-600 mb-1">{q}</label><select value={formData.data[q] || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, [q]: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Very happy</option><option>Happy</option><option>Neutral</option><option>Unhappy</option><option>Very unhappy</option></select></div>
                    ))}
                  </>
                )}

                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Summary</label><textarea value={formData.data.summary || ''} onChange={e => setFormData(prev => ({ ...prev, data: { ...prev.data, summary: e.target.value } }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Total Score</label><input type="text" value={formData.score} onChange={e => setFormData(prev => ({ ...prev, score: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Conducted By</label><select value={formData.conductedBy} onChange={e => setFormData(prev => ({ ...prev, conductedBy: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{staff.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>))}</select></div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={save} disabled={saving || !formData.name} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


