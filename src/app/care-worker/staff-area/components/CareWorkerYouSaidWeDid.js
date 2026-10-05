'use client';

import { useState, useEffect, useMemo } from 'react';

const ROLES = [
  { value: 'Service User / Resident', label: 'Resident / Service User', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Family Member / Next of Kin', label: 'Family Member / Relative', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Staff / Care Worker', label: 'Staff / Care Worker (Self or Colleague)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Professional / Social Worker', label: 'Healthcare Professional / Social Worker', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Visitor / Volunteer', label: 'Visitor / Volunteer', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'Other', label: 'Other', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

const CHANNELS = [
  'Verbal / In-Person Conversation',
  'Residents Meeting',
  'Family Meeting / Visit',
  '1:1 Review / Keyworker Session',
  'Survey / Feedback Questionnaire',
  'Suggestion Box',
  'Phone Call',
  'Other'
];

export default function CareWorkerYouSaidWeDid({ onShowToast }) {
  const [entries, setEntries] = useState([]);
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New feedback form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    person: '',
    role: 'Service User / Resident',
    howRaised: 'Verbal / In-Person Conversation',
    type: 'SUGGESTION',
    youSaid: '',
    weDid: '',
  });

  const [useResidentPicker, setUseResidentPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const [entriesRes, seekersRes] = await Promise.all([
        fetch('/api/quality-assurance', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/service-seekers', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (entriesRes.ok) {
        const json = await entriesRes.json();
        if (json.success && Array.isArray(json.data)) {
          setEntries(json.data);
        }
      }

      if (seekersRes && seekersRes.ok) {
        const seekersJson = await seekersRes.json();
        if (Array.isArray(seekersJson)) {
          setServiceSeekers(seekersJson.filter(s => s.status === 'LIVE'));
        }
      }
    } catch (err) {
      console.error('Error fetching You Said We Did data for care worker:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.person.trim()) {
      alert('Please specify who provided this feedback (Resident, Family, or Staff name).');
      return;
    }
    if (!formData.youSaid.trim()) {
      alert('Please describe what they said.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/quality-assurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          status: formData.weDid.trim() ? 'IN_PROGRESS' : 'OPEN'
        })
      });

      const result = await res.json();
      if (result.success) {
        onShowToast('Feedback submitted successfully! Thank you for contributing to continuous improvement.', 'success');
        setShowSubmitModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          person: '',
          role: 'Service User / Resident',
          howRaised: 'Verbal / In-Person Conversation',
          type: 'SUGGESTION',
          youSaid: '',
          weDid: '',
        });
        fetchData();
      } else {
        onShowToast(result.error || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      onShowToast('Error submitting feedback. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterStatus === 'completed' && e.status !== 'CLOSED') return false;
      if (filterStatus === 'in_progress' && e.status !== 'IN_PROGRESS') return false;
      if (filterStatus === 'open' && (e.status !== 'OPEN' && e.status)) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const p = (e.person || e.from || '').toLowerCase();
        const r = (e.role || '').toLowerCase();
        const ys = (e.youSaid || '').toLowerCase();
        const wd = (e.weDid || '').toLowerCase();
        if (!p.includes(q) && !r.includes(q) && !ys.includes(q) && !wd.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = entries.length;
    const completed = entries.filter(e => e.status === 'CLOSED').length;
    const inProgress = entries.filter(e => e.status === 'IN_PROGRESS').length;
    return { total, completed, inProgress };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Listening & Responding
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-2">You Said, We Did</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            See how resident, relative, and staff feedback is turned into real improvements. As frontline staff, your voice and resident feedback matter.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#224fa6] text-white text-sm font-semibold hover:bg-[#1a3e85] shadow-md transition-all self-start sm:self-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Log Feedback / Suggestion</span>
        </button>
      </div>

      {/* Metric summary badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Logged</span>
          <div className="text-xl font-extrabold text-gray-900 mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-emerald-100 bg-emerald-50/20 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">We Did (Done)</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-blue-100 bg-blue-50/20 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">In Progress</span>
          <div className="text-xl font-extrabold text-blue-700 mt-0.5">{stats.inProgress}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search feedback by resident, family, topic, or resolution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-gray-400 mr-1">Status:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: 'Completed (We Did)' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'open', label: 'Under Review' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === tab.id
                  ? 'bg-[#224fa6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Feed / Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]"></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 px-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#224fa6] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-800">No feedback entries found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'all'
              ? 'No entries match your search criteria.'
              : 'Be the first to log resident, family, or staff feedback using the button above!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((item) => {
            const personName = item.person || item.from || 'Anonymous';
            const role = item.role || 'Service User / Resident';
            const howRaised = item.howRaised || 'Conversation';
            const isCompleted = item.status === 'CLOSED';
            const isInProgress = item.status === 'IN_PROGRESS';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-900">{personName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {role}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</span>
                        <span>•</span>
                        <span>{howRaised}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isCompleted ? 'Implemented' : isInProgress ? 'In Progress' : 'Under Review'}
                    </span>
                  </div>

                  {/* You Said Block */}
                  <div className="mt-3.5 bg-blue-50/50 rounded-xl p-3 border border-blue-100/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#224fa6] mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      YOU SAID
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {item.youSaid || 'No feedback details recorded.'}
                    </p>
                  </div>

                  {/* We Did Block */}
                  <div className="mt-2.5 bg-emerald-50/40 rounded-xl p-3 border border-emerald-100/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      WE DID
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {item.weDid || (
                        <span className="text-amber-700 italic text-[11px]">
                          Management is reviewing and preparing action steps.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Footer stamp */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                  <span>Logged by: {item.createdBy?.firstName ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'Staff'}</span>
                  <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB') : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Submit Feedback Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-emerald-50/30">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Feedback / Suggestion</h3>
                  <p className="text-[11px] text-gray-500">Record comments heard from residents, relatives, or staff</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                />
              </div>

              {/* Who gave feedback */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Who gave this feedback? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 mb-2"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {/* Person name / resident picker */}
                {serviceSeekers.length > 0 && formData.role.includes('Resident') ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-500">Resident Name</span>
                      <button
                        type="button"
                        onClick={() => setUseResidentPicker(!useResidentPicker)}
                        className="text-[11px] text-[#224fa6] hover:underline"
                      >
                        {useResidentPicker ? 'Type name' : 'Choose from active residents'}
                      </button>
                    </div>

                    {useResidentPicker ? (
                      <select
                        value={formData.person}
                        onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                      >
                        <option value="">Select resident...</option>
                        {serviceSeekers.map(s => (
                          <option key={s.id} value={`${s.firstName} ${s.lastName}`}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Smith"
                        value={formData.person}
                        onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-1">Person Name</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mary (Daughter), or Self (Staff)"
                      value={formData.person}
                      onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                    />
                  </div>
                )}
              </div>

              {/* How was this raised? */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  How was this raised?
                </label>
                <select
                  value={formData.howRaised}
                  onChange={(e) => setFormData({ ...formData, howRaised: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                >
                  {CHANNELS.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              {/* What did they say? (You Said) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  You Said (What feedback or idea was shared?) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Mrs. Davies mentioned she would love more classical music during afternoon tea, and requested a larger print activity schedule."
                  value={formData.youSaid}
                  onChange={(e) => setFormData({ ...formData, youSaid: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                />
              </div>

              {/* Immediate action or suggestion (We Did) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Immediate action taken or suggestion (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Printed a large font schedule immediately and informed activity coordinator."
                  value={formData.weDid}
                  onChange={(e) => setFormData({ ...formData, weDid: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#224fa6] rounded-xl hover:bg-[#1a3e85] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Feedback</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
