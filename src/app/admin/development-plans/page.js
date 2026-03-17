'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

const GOAL_STATUS_COLORS = {
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500'
};

export default function DevelopmentPlansPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdps, setPdps] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [expandedPdp, setExpandedPdp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPdp, setSelectedPdp] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [form, setForm] = useState({ userId: '', reviewDate: '', notes: '' });
  const [goalForm, setGoalForm] = useState({ goal: '', targetDate: '', status: 'IN_PROGRESS', notes: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { setUser(JSON.parse(storedUser)); }
    else { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (user) { fetchPDPs(); fetchStaff(); }
  }, [user]);

  const fetchPDPs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/development-plans', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setPdps(result.data);
    } catch { showNotification('Error loading PDPs', 'error'); }
    finally { setIsLoading(false); }
  };

  const fetchStaff = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/training/matrix', { headers: { Authorization: `Bearer ${token}` } });
    const result = await res.json();
    if (result.success) setAllStaff(result.data.staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
  };

  const handleCreatePDP = async () => {
    if (!form.userId) { showNotification('Staff member is required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/development-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (result.success) {
        showNotification('PDP created');
        setShowModal(false);
        fetchPDPs();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error creating PDP', 'error'); }
  };

  const handleAddGoal = async () => {
    if (!goalForm.goal || !selectedPdp) { showNotification('Goal is required', 'error'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/development-plans/${selectedPdp.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(goalForm)
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Goal added');
        setShowGoalModal(false);
        setGoalForm({ goal: '', targetDate: '', status: 'IN_PROGRESS', notes: '' });
        fetchPDPs();
      } else showNotification(result.error, 'error');
    } catch { showNotification('Error adding goal', 'error'); }
  };

  const handleUpdateGoalStatus = async (goalId, status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/development-plans/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchPDPs();
    } catch { showNotification('Error updating goal', 'error'); }
  };

  const handleArchivePDP = async (id) => {
    if (!confirm('Archive this PDP?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/development-plans/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showNotification('PDP archived');
    fetchPDPs();
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Personal Development Plans</h1>
              <p className="text-gray-600">Set and track staff learning goals and development objectives</p>
            </div>
            <button onClick={() => { setForm({ userId: '', reviewDate: '', notes: '' }); setShowModal(true); }}
              className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm">
              + New PDP
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6]"></div>
            </div>
          ) : pdps.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <p className="text-gray-500 mb-4">No personal development plans yet.</p>
              <button onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium">
                Create First PDP
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pdps.map(pdp => {
                const completedGoals = pdp.goals.filter(g => g.status === 'COMPLETED').length;
                const totalGoals = pdp.goals.length;
                const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
                const isExpanded = expandedPdp === pdp.id;

                return (
                  <div key={pdp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedPdp(isExpanded ? null : pdp.id)}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {pdp.user.firstName[0]}{pdp.user.lastName[0]}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{pdp.user.firstName} {pdp.user.lastName}</h3>
                          <p className="text-sm text-gray-500">
                            {totalGoals} goal{totalGoals !== 1 ? 's' : ''} · Review: {fmt(pdp.reviewDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">{completedGoals}/{totalGoals} completed</div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-5">
                        {pdp.notes && <p className="text-sm text-gray-600 mb-4 italic">{pdp.notes}</p>}

                        <div className="space-y-2 mb-4">
                          {pdp.goals.length === 0 && <p className="text-sm text-gray-500">No goals added yet.</p>}
                          {pdp.goals.map(goal => (
                            <div key={goal.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start space-x-3">
                                <input type="checkbox" checked={goal.status === 'COMPLETED'}
                                  onChange={() => handleUpdateGoalStatus(goal.id, goal.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED')}
                                  className="mt-0.5 w-4 h-4 text-green-500 rounded cursor-pointer" />
                                <div>
                                  <p className={`text-sm ${goal.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{goal.goal}</p>
                                  {goal.targetDate && <p className="text-xs text-gray-500 mt-0.5">Target: {fmt(goal.targetDate)}</p>}
                                  {goal.notes && <p className="text-xs text-gray-400 mt-0.5">{goal.notes}</p>}
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${GOAL_STATUS_COLORS[goal.status]}`}>
                                {goal.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-3">
                          <button onClick={() => { setSelectedPdp(pdp); setShowGoalModal(true); }}
                            className="px-4 py-2 border border-[#224fa6] text-[#224fa6] rounded-lg text-sm font-medium hover:bg-blue-50">
                            + Add Goal
                          </button>
                          <button onClick={() => handleArchivePDP(pdp.id)}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                            Archive PDP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New PDP Modal */}
          {showModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">New Personal Development Plan</h3>
                  <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member *</label>
                    <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900">
                      <option value="">Select staff...</option>
                      {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Review Date</label>
                    <input type="date" value={form.reviewDate} onChange={e => setForm(p => ({ ...p, reviewDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleCreatePDP} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">Create PDP</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Goal Modal */}
          {showGoalModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] px-6 py-4 rounded-t-2xl flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Add Development Goal</h3>
                  <button onClick={() => setShowGoalModal(false)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Goal *</label>
                    <textarea value={goalForm.goal} onChange={e => setGoalForm(p => ({ ...p, goal: e.target.value }))}
                      rows={3} placeholder="e.g. Complete Dementia Lead training by December"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Date</label>
                    <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm(p => ({ ...p, targetDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea value={goalForm.notes} onChange={e => setGoalForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-none" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowGoalModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleAddGoal} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl font-medium hover:shadow-lg">Add Goal</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Notification show={notification.show} message={notification.message} type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })} />
        </main>
      </div>
    </div>
  );
}
