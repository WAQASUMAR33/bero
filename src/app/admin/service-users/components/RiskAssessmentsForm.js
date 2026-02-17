'use client';

import { useEffect, useMemo, useState } from 'react';

const riskTypes = [
  'Anticoagulants', 'Bedrail Entrapment', 'Challenging Behaviour', 'Choking', 'Court trip', 'Denture', 'Falls from Windows and Balconies', 'Falls Risks / Slips and Trips', 'Financial Abuse', 'Health and Safety House', 'Home', 'Legionella', 'Management Plan', 'Mobility Wheelchair', 'Moving and Handling', 'Scalding and Burning', 'Staff', 'Sugar Levels', 'Trigger plan and protocol', 'Violence, Aggression or Challenging Behaviour'
];

export default function RiskAssessmentsForm({ serviceSeekerId, serviceUserName, onNotification }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    riskType: '', lastAssessed: '', reviewFrequency: 'Every six months or 26 weeks',
    whatIsRisk: '', riskBeforeIntervention: '', whoIsAtRisk: '', isHistorical: '', whatCouldHappen: '', actionToTake: '', riskAfterControls: '', summary: '', riskLevel: '', totalScore: '', staffTeam: [], conductedBy: '', office: '', sendSignoffs: false, extra: {}
  });

  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchRows(); }, [serviceSeekerId]);
  useEffect(() => { fetchStaff(); fetchTeams(); }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setStaff(await res.json()); }
    } catch (e) { console.error(e); }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) { const json = await res.json(); if (json.success) setTeams(json.data); }
    } catch (e) { console.error(e); }
  };

  const fetchRows = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { setRows(await res.json()); } } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const formatDate = (s) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return s || '-' } };

  const openAdd = () => { setFormData({ riskType: '', lastAssessed: '', reviewFrequency: 'Every six months or 26 weeks', whatIsRisk: '', riskBeforeIntervention: '', whoIsAtRisk: '', isHistorical: '', whatCouldHappen: '', actionToTake: '', riskAfterControls: '', summary: '', riskLevel: '', totalScore: '', staffTeam: [], conductedBy: '', office: '', sendSignoffs: false, extra: {} }); setShowModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
      if (res.ok) { await fetchRows(); setShowModal(false); if (onNotification) onNotification({ show: true, message: 'Risk assessment saved.', type: 'success' }); }
      else { const err = await res.json(); if (onNotification) onNotification({ show: true, message: err.error || 'Failed to save risk assessment.', type: 'error' }); }
    } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Failed to save risk assessment.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const deleteRow = async (id) => { setSaving(true); try { const token = localStorage.getItem('token'); const res = await fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { await fetchRows(); if (onNotification) onNotification({ show: true, message: 'Deleted.', type: 'success' }); } } catch (e) { console.error(e); if (onNotification) onNotification({ show: true, message: 'Delete failed.', type: 'error' }); } finally { setSaving(false); } };

  const isChoking = formData.riskType === 'Choking';

  const chokingOptions = [
    'Weak or ineffectual cough; inability to clear throat', 'Difficulty in swallowing', 'Known to aspirate', 'Frequent chest infections', 'Poor physical state either as a result of condition or a health problem', 'A diagnosis of epilepsy', 'A diagnosis of cerebral Palsy', 'Severe and enduring mental health problems', 'Confusion/disorientation', 'Poor head control', 'Poor posture', 'Tendency to tongue thrust', 'Breathing difficulties', 'Has previously required urgent attention due to choking when eating or drinking', 'Feeds self independently and safely', 'Feeds self independently and safely with supervision', 'Tendency to take food from others if not supervised', 'Tendency to take food from fruit bowl/cupboards if not supervised and be unsafe', 'Drinks independently and safely', 'Eats rapidly', 'Drinks rapidly', 'Requires assistance with food cutting or preparing prior to consuming', 'Will overload mouth with food/drink', 'Will store food and drink in mouth', 'Will swallow food without chewing', 'Will continue to eat whilst coughing', 'Will continue to drink whilst coughing', 'Eats safely with dentures/without dentures/without teeth', 'Will accept/put any item into mouth', 'Will accept/put any item into mouth and swallow', 'Is prescribed a modified consistency diet', 'Requires thickened fluids', 'Requires specialist feeding aids to reduce the risk of choking', 'Requires specialist drinking aids to reduce the risk of choking'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Risk Assessment - Generic</h2>
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Assessed</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Review Frequency</th>
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
                    <td className="py-3 px-4 text-sm text-gray-900">{r.riskType}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.totalScore || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.riskLevel || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{r.reviewFrequency || '-'}</td>
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
                    <label className="block text-sm text-gray-600 mb-1">Risk</label>
                    <select value={formData.riskType} onChange={e => setFormData(prev => ({ ...prev, riskType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                      <option value="">Please Select</option>
                      {riskTypes.map(rt => (<option key={rt} value={rt}>{rt}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Assessed</label>
                  <input type="date" value={formData.lastAssessed} onChange={e => setFormData(prev => ({ ...prev, lastAssessed: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Review Frequency</label>
                  <input type="text" value={formData.reviewFrequency} onChange={e => setFormData(prev => ({ ...prev, reviewFrequency: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Every six months or 26 weeks" />
                </div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What is the risk?</label><textarea value={formData.whatIsRisk} onChange={e => setFormData(prev => ({ ...prev, whatIsRisk: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Risk before intervention?</label><select value={formData.riskBeforeIntervention} onChange={e => setFormData(prev => ({ ...prev, riskBeforeIntervention: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Low</option><option>Medium</option><option>High</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Who is at risk?</label><input type="text" value={formData.whoIsAtRisk} onChange={e => setFormData(prev => ({ ...prev, whoIsAtRisk: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Is the risk historical?</label><select value={formData.isHistorical} onChange={e => setFormData(prev => ({ ...prev, isHistorical: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Yes</option><option>No</option></select></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">What could happen?</label><textarea value={formData.whatCouldHappen} onChange={e => setFormData(prev => ({ ...prev, whatCouldHappen: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Action to take by staff?</label><textarea value={formData.actionToTake} onChange={e => setFormData(prev => ({ ...prev, actionToTake: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Risk occurring following implementation of control measures?</label><select value={formData.riskAfterControls} onChange={e => setFormData(prev => ({ ...prev, riskAfterControls: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Low</option><option>Medium</option><option>High</option></select></div>

                {isChoking && (
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-2">Choking related items</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {chokingOptions.map(opt => (
                        <label key={opt} className="text-sm text-gray-700 flex items-center space-x-2">
                          <input type="checkbox" checked={(formData.extra?.choking || []).includes(opt)} onChange={(e) => {
                            setFormData(prev => { const sel = new Set(prev.extra?.choking || []); if (e.target.checked) sel.add(opt); else sel.delete(opt); return { ...prev, extra: { ...(prev.extra || {}), choking: Array.from(sel) } }; });
                          }} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Summary</label><textarea value={formData.summary} onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" rows={3} /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Risk Level</label><select value={formData.riskLevel} onChange={e => setFormData(prev => ({ ...prev, riskLevel: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option><option>Low</option><option>Medium</option><option>High</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Total Score</label><input type="text" value={formData.totalScore} onChange={e => setFormData(prev => ({ ...prev, totalScore: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>

                <div className="md:col-span-2"><h4 className="text-sm font-semibold text-gray-900 mt-2">Signatures</h4></div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Team</label>
                  <select
                    value={formData.extra?.teamId || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      extra: { ...(prev.extra || {}), teamId: e.target.value }
                    }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value="">Select Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Staff/Team</label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {staff.map(s => (
                      <label key={s.id} className="text-sm text-gray-700 flex items-center space-x-2">
                        <input type="checkbox" checked={formData.staffTeam.includes(`${s.firstName} ${s.lastName}`)} onChange={(e) => {
                          const name = `${s.firstName} ${s.lastName}`;
                          setFormData(prev => ({ ...prev, staffTeam: e.target.checked ? Array.from(new Set([...(prev.staffTeam || []), name])) : (prev.staffTeam || []).filter(x => x !== name) }));
                        }} />
                        <span>{s.firstName} {s.lastName}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm text-gray-600 mb-1">Office</label><input type="text" value={formData.office} onChange={e => setFormData(prev => ({ ...prev, office: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Send Signoffs?</label><select value={formData.sendSignoffs ? 'Yes' : 'No'} onChange={e => setFormData(prev => ({ ...prev, sendSignoffs: e.target.value === 'Yes' }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option>No</option><option>Yes</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Conducted By</label><select value={formData.conductedBy} onChange={e => setFormData(prev => ({ ...prev, conductedBy: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-gray-900"><option value="">Please Select</option>{staff.map(s => (<option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>))}</select></div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium">Cancel</button>
              <button type="button" onClick={save} disabled={saving || !formData.riskType} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


