'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function TeamsPage() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({ name: '', memberIds: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', memberIds: [] });
  const [isUpdating, setIsUpdating] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (message, type = 'success') => setNotification({ show: true, message, type });
  const hideNotification = () => setNotification({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchTeams();
      fetchAllStaff();
    }
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/teams');
      const json = await res.json();
      if (json.success) setTeams(json.data);
    } catch (e) {
      console.error('fetchTeams error', e);
      showNotification('Failed to load teams', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return;
      const allUsers = await res.json();
      setAllStaff(allUsers);
    } catch (e) {
      console.error('fetchAllStaff error', e);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Team name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim(), memberIds: formData.memberIds })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowAddModal(false);
        setFormData({ name: '', memberIds: [] });
        await fetchTeams();
        await fetchAllStaff();
        showNotification('Team created successfully', 'success');
      } else {
        showNotification(json.error || 'Failed to create team', 'error');
      }
    } catch (e) {
      console.error('create team error', e);
      showNotification('Failed to create team', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCreateMember = (id) => {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  const openEditModal = (team) => {
    setActiveTeam(team);
    setEditFormData({
      name: team.name,
      memberIds: team.members.map((member) => member.id),
    });
    setShowEditModal(true);
  };

  const toggleEditMember = (id) => {
    setEditFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!activeTeam) return;

    if (!editFormData.name.trim()) {
      showNotification('Team name is required', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/teams/${activeTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          memberIds: editFormData.memberIds,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowEditModal(false);
        setActiveTeam(null);
        await fetchTeams();
        await fetchAllStaff();
        showNotification('Team updated successfully', 'success');
      } else {
        showNotification(json.error || 'Failed to update team', 'error');
      }
    } catch (error) {
      console.error('update team error', error);
      showNotification('Failed to update team', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteTeam = (team) => {
    setTeamToDelete(team);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTeamToDelete(null);
        await fetchTeams();
        await fetchAllStaff();
        showNotification('Team deleted successfully', 'success');
      } else {
        showNotification(json.error || 'Failed to delete team', 'error');
      }
    } catch (error) {
      console.error('delete team error', error);
      showNotification('Failed to delete team', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setTeamToDelete(null);
  };

  if (!user) return null;

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const unassignedStaff = allStaff.filter(u => !u.teamId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading teams...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
                    <p className="text-gray-600">Group staff into teams. A staff can belong to only one team.</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Team</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search teams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredTeams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{team.name}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              {team.members.map(m => (
                                <span key={m.id} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                                  {m.firstName} {m.lastName}
                                </span>
                              ))}
                              {team.members.length === 0 && <span className="text-sm text-gray-500">No members</span>}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{new Date(team.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => openEditModal(team)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteTeam(team)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Create Team</h3>
                      <p className="text-sm text-gray-600 mt-1">Select staff to assign to this team (each staff can belong to only one team)</p>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleCreateTeam} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Team A"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Members (optional)</label>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-white">
                        {unassignedStaff.length === 0 ? (
                          <div className="text-sm text-gray-500">No unassigned staff available</div>
                        ) : (
                          unassignedStaff.map((s) => (
                            <label key={s.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={formData.memberIds.includes(s.id)}
                                  onChange={() => toggleCreateMember(s.id)}
                                  className="rounded border-gray-300 text-[#224fa6] focus:ring-[#224fa6] w-4 h-4"
                                />
                                <span className="text-sm text-gray-800 font-medium">{s.firstName} {s.lastName}</span>
                              </div>
                              <span className="text-xs text-gray-500">{s.email}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Creating...' : 'Create Team'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showEditModal && activeTeam && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Edit Team</h3>
                      <p className="text-sm text-gray-600 mt-1">Update the team name or adjust member assignments.</p>
                    </div>
                    <button onClick={() => { setShowEditModal(false); setActiveTeam(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleUpdateTeam} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name *</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Team A"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Manage Members</label>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-white space-y-1">
                        {allStaff.length === 0 ? (
                          <div className="text-sm text-gray-500">No staff records available</div>
                        ) : (
                          allStaff.map((staffMember) => {
                            const isMember = editFormData.memberIds.includes(staffMember.id);
                            const assignedElsewhere = staffMember.teamId && staffMember.teamId !== activeTeam.id;
                            const disabled = assignedElsewhere && !isMember;

                            return (
                              <label
                                key={staffMember.id}
                                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isMember}
                                    disabled={disabled}
                                    onChange={() => toggleEditMember(staffMember.id)}
                                    className="rounded border-gray-300 text-[#224fa6] focus:ring-[#224fa6] w-4 h-4"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{staffMember.firstName} {staffMember.lastName}</p>
                                    <p className="text-xs text-gray-500">{staffMember.email}</p>
                                  </div>
                                </div>
                                {assignedElsewhere && !isMember && (
                                  <span className="text-xs font-medium text-red-500">Assigned to another team</span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => { setShowEditModal(false); setActiveTeam(null); }}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {teamToDelete && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Delete Team</h3>
                  <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete the team <span className="font-semibold">{teamToDelete.name}</span>? All members will become unassigned.</p>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteTeam}
                    disabled={isDeleting}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <Notification show={notification.show} message={notification.message} type={notification.type} onClose={hideNotification} />
        </main>
      </div>
    </div>
  );
}


