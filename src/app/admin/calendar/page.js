'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterServiceSeekerId, setFilterServiceSeekerId] = useState('');
  const [filterAnnounced, setFilterAnnounced] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const entryTypes = [
    { value: 'MANAGEMENT_MEETING', label: 'Management Meeting' },
    { value: 'STAFF_MEETING', label: 'Staff Meeting' },
    { value: 'RESIDENT_MEETING', label: 'Resident Meeting' },
    { value: 'FAMILY_VISIT', label: 'Family Visit' },
    { value: 'PROFESSIONAL_VISIT', label: 'Professional Visit' },
    { value: 'EVENT', label: 'Event' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchServiceSeekers();
      fetchStaff();
      fetchEntries();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchServiceSeekers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/service-seekers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setServiceSeekers(data.filter(s => s.status === 'LIVE'));
      }
    } catch (error) {
      console.error('Error fetching service seekers:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setStaff(data.filter(u => u.status === 'CURRENT'));
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/calendar-entries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setEntries(result.data);
      } else {
        console.error('Error fetching entries:', result.error);
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calendar-entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setEntries(prev => prev.filter(e => e.id !== id));
        showNotification('Entry deleted successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification('Error deleting entry. Please try again.', 'error');
    }
  };

  const getEntryTypeLabel = (type) => {
    return entryTypes.find(t => t.value === type)?.label || type;
  };

  const getEntryTypeIcon = (type) => {
    switch (type) {
      case 'MANAGEMENT_MEETING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'STAFF_MEETING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
      case 'RESIDENT_MEETING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'FAMILY_VISIT':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'PROFESSIONAL_VISIT':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            <path d="M15.707 13.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414l-1.293 1.293-1.293-1.293z" />
          </svg>
        );
      case 'EVENT':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getEntryDetails = (entry) => {
    switch (entry.entryType) {
      case 'MANAGEMENT_MEETING':
      case 'STAFF_MEETING':
      case 'RESIDENT_MEETING':
        return entry.about || entry.notes || 'Meeting';
      case 'FAMILY_VISIT':
      case 'PROFESSIONAL_VISIT':
        return entry.purpose || entry.name || 'Visit';
      case 'EVENT':
        return entry.eventDescription || 'Event';
      default:
        return 'Entry';
    }
  };

  // Apply filters and search
  const filteredEntries = entries.filter((entry) => {
    if (filterType !== 'all' && entry.entryType !== filterType) {
      return false;
    }

    if (filterServiceSeekerId && String(entry.serviceSeekerId || '') !== filterServiceSeekerId) {
      return false;
    }

    if (filterAnnounced !== 'all') {
      const announcedValue = entry.announced || null;
      if (filterAnnounced === 'YES' && announcedValue !== 'YES') return false;
      if (filterAnnounced === 'NO' && announcedValue !== 'NO') return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const residentName = entry.serviceSeeker
        ? (entry.serviceSeeker.preferredName ||
            `${entry.serviceSeeker.firstName} ${entry.serviceSeeker.lastName}`).toLowerCase()
        : '';
      const details = (getEntryDetails(entry) || '').toLowerCase();
      const typeLabel = getEntryTypeLabel(entry.entryType).toLowerCase();

      if (
        !residentName.includes(q) &&
        !details.includes(q) &&
        !typeLabel.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  if (!user) {
    return null;
  }

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
                <p className="text-gray-600">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
                    <p className="text-gray-600">Manage visits and meetings for service users</p>
                  </div>
                  <button
                    onClick={() => setShowTypeSelector(true)}
                    className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Entry</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by type, resident or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Type filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All Types</option>
                      {entryTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Service user filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service User</label>
                    <select
                      value={filterServiceSeekerId}
                      onChange={(e) => setFilterServiceSeekerId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="">All Service Users</option>
                      {serviceSeekers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.preferredName || `${s.firstName} ${s.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Announced filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Announced</label>
                    <select
                      value={filterAnnounced}
                      onChange={(e) => setFilterAnnounced(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All</option>
                      <option value="YES">Announced</option>
                      <option value="NO">Unannounced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Entries List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Entries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resident</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                            No entries found. Click &quot;Add Entry&quot; to create one.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="text-[#224fa6]">
                                  {getEntryTypeIcon(entry.entryType)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getEntryTypeLabel(entry.entryType)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.serviceSeeker 
                                  ? (entry.serviceSeeker.preferredName || `${entry.serviceSeeker.firstName} ${entry.serviceSeeker.lastName}`)
                                  : '-'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm text-gray-900 max-w-md truncate">
                                {getEntryDetails(entry)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(entry.date).toLocaleDateString('en-GB')}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.time || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setSelectedEntryType(entry.entryType);
                                    setShowAddModal(true);
                                  }}
                                  className="p-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Type Selector Modal */}
          {showTypeSelector && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Select Entry Type</h3>
                    <button
                      onClick={() => setShowTypeSelector(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {entryTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedEntryType(type.value);
                          setShowTypeSelector(false);
                          setShowAddModal(true);
                          setSelectedEntry(null);
                        }}
                        className="w-full text-left px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-[#224fa6] hover:text-white hover:border-[#224fa6] transition-all duration-200 bg-white text-gray-900 font-medium"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Entry Modal */}
          {showAddModal && selectedEntryType && (
            <CalendarEntryFormModal
              entryType={selectedEntryType}
              entry={selectedEntry}
              serviceSeekers={serviceSeekers}
              staff={staff}
              onClose={() => {
                setShowAddModal(false);
                setSelectedEntryType(null);
                setSelectedEntry(null);
              }}
              onSave={async (formData) => {
                try {
                  setIsSubmitting(true);
                  const token = localStorage.getItem('token');
                  const url = selectedEntry 
                    ? `/api/calendar-entries/${selectedEntry.id}`
                    : '/api/calendar-entries';
                  const method = selectedEntry ? 'PUT' : 'POST';

                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      ...formData,
                      entryType: selectedEntryType
                    })
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    showNotification(selectedEntry ? 'Entry updated successfully!' : 'Entry created successfully!', 'success');
                    setShowAddModal(false);
                    setSelectedEntryType(null);
                    setSelectedEntry(null);
                    fetchEntries();
                  } else {
                    showNotification(`Error: ${result.error}`, 'error');
                  }
                } catch (error) {
                  console.error('Error saving entry:', error);
                  showNotification('Error saving entry. Please try again.', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              isSubmitting={isSubmitting}
            />
          )}

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: 'success' })}
          />
        </main>
      </div>
    </div>
  );
}

// Calendar Entry Form Modal Component
function CalendarEntryFormModal({ entryType, entry, serviceSeekers, staff, onClose, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    serviceSeekerId: entry?.serviceSeekerId || '',
    date: entry ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: entry?.time ? entry.time.split(':').slice(0, 2).join(':') : '',
    hour: entry?.time && entry.time.includes(':') ? entry.time.split(':')[0] : '00',
    minute: entry?.time && entry.time.includes(':') ? entry.time.split(':')[1] : '00',
    // Meeting fields
    chairedBy: entry?.chairedBy || '',
    about: entry?.about || 'General',
    notes: entry?.notes || '',
    actions: entry?.actions || '',
    concerns: entry?.concerns || '',
    invites: entry?.invites || [],
    // Visit fields
    announced: entry?.announced || 'YES',
    name: entry?.name || '',
    relationship: entry?.relationship || '',
    role: entry?.role || '',
    purpose: entry?.purpose || '',
    summary: entry?.summary || '',
    completed: entry?.completed || 'YES',
    // Event fields
    careWorkerId: entry?.careWorkerId || '',
    eventDescription: entry?.eventDescription || ''
  });

  // Update form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        serviceSeekerId: entry.serviceSeekerId || '',
        date: new Date(entry.date).toISOString().split('T')[0],
        time: entry.time ? entry.time.split(':').slice(0, 2).join(':') : '',
        hour: entry.time && entry.time.includes(':') ? entry.time.split(':')[0] : '00',
        minute: entry.time && entry.time.includes(':') ? entry.time.split(':')[1] : '00',
        chairedBy: entry.chairedBy || '',
        about: entry.about || 'General',
        notes: entry.notes || '',
        actions: entry.actions || '',
        concerns: entry.concerns || '',
        invites: entry.invites || [],
        announced: entry.announced || 'YES',
        name: entry.name || '',
        relationship: entry.relationship || '',
        role: entry.role || '',
        purpose: entry.purpose || '',
        summary: entry.summary || '',
        completed: entry.completed || 'YES',
        careWorkerId: entry.careWorkerId || '',
        eventDescription: entry.eventDescription || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        serviceSeekerId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        hour: '00',
        minute: '00',
        chairedBy: '',
        about: 'General',
        notes: '',
        actions: '',
        concerns: '',
        invites: [],
        announced: 'YES',
        name: '',
        relationship: '',
        role: '',
        purpose: '',
        summary: '',
        completed: 'YES',
        careWorkerId: '',
        eventDescription: ''
      });
    }
  }, [entry]);

  const professionalRoles = [
    'ONE_ONE_ONE_VISIT', 'ATTYPD_18_25', 'CHIROPODIST', 'CLINICAL_NAVIGATION',
    'CLINICAL_PSYCHOLOGIST', 'DISTRICT_NURSE', 'DOLS', 'ENRICH_TEAM', 'FCPA',
    'GP', 'MANAGER', 'OTHER', 'PARAMEDIC', 'PROBATIC_PRACTITIONER', 'SALT',
    'SOCIAL_WORKER', 'TEAM_MANAGER'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      serviceSeekerId: formData.serviceSeekerId || null,
      date: formData.date,
      time: formData.hour && formData.minute ? `${formData.hour}:${formData.minute}` : null
    };

    // Add fields based on entry type
    if (['MANAGEMENT_MEETING', 'STAFF_MEETING', 'RESIDENT_MEETING'].includes(entryType)) {
      submitData.chairedBy = formData.chairedBy;
      submitData.about = formData.about;
      submitData.notes = formData.notes;
      submitData.actions = formData.actions;
      submitData.concerns = formData.concerns;
      submitData.invites = formData.invites;
    }

    if (['FAMILY_VISIT', 'PROFESSIONAL_VISIT'].includes(entryType)) {
      submitData.announced = formData.announced;
      submitData.name = formData.name;
      submitData.purpose = formData.purpose;
      submitData.summary = formData.summary;
      submitData.completed = formData.completed;
      if (entryType === 'FAMILY_VISIT') {
        submitData.relationship = formData.relationship;
      } else {
        submitData.role = formData.role;
      }
    }

    if (entryType === 'EVENT') {
      submitData.careWorkerId = formData.careWorkerId || null;
      submitData.eventDescription = formData.eventDescription;
    }

    onSave(submitData);
  };

  const toggleStaffInvite = (staffId) => {
    setFormData(prev => {
      const invites = prev.invites || [];
      const index = invites.findIndex(inv => inv.userId === staffId);
      if (index >= 0) {
        return { ...prev, invites: invites.filter((_, i) => i !== index) };
      } else {
        return { ...prev, invites: [...invites, { userId: staffId, signedOn: null }] };
      }
    });
  };

  const getEntryTypeTitle = () => {
    const titles = {
      'MANAGEMENT_MEETING': 'Add Management Meeting',
      'STAFF_MEETING': 'Add Staff Meeting',
      'RESIDENT_MEETING': 'Add Resident Meeting',
      'FAMILY_VISIT': 'Add Family Visit',
      'PROFESSIONAL_VISIT': 'Add Professional Visit',
      'EVENT': 'Add Event'
    };
    return entry ? titles[entryType]?.replace('Add', 'Edit') : titles[entryType] || 'Add Entry';
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{getEntryTypeTitle()}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Common Fields */}
          {(entryType === 'FAMILY_VISIT' || entryType === 'PROFESSIONAL_VISIT' || entryType === 'EVENT') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Service User</label>
              <select
                value={formData.serviceSeekerId}
                onChange={(e) => setFormData({...formData, serviceSeekerId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Please Select</option>
                {serviceSeekers.map(seeker => (
                  <option key={seeker.id} value={seeker.id}>
                    {seeker.preferredName || `${seeker.firstName} ${seeker.lastName}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              />
            </div>

            {(entryType === 'FAMILY_VISIT' || entryType === 'PROFESSIONAL_VISIT' || entryType === 'EVENT') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <div className="relative flex gap-2">
                  <select
                    value={formData.hour}
                    onChange={(e) => setFormData({...formData, hour: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 appearance-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    value={formData.minute}
                    onChange={(e) => setFormData({...formData, minute: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 appearance-none"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Fields */}
          {['MANAGEMENT_MEETING', 'STAFF_MEETING', 'RESIDENT_MEETING'].includes(entryType) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chaired</label>
                  <input
                    type="text"
                    value={formData.chairedBy}
                    onChange={(e) => setFormData({...formData, chairedBy: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                    placeholder="Enter chair name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">About</label>
                  <select
                    value={formData.about}
                    onChange={(e) => setFormData({...formData, about: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="General">General</option>
                    <option value="Specific">Specific</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter notes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Actions</label>
                <textarea
                  value={formData.actions}
                  onChange={(e) => setFormData({...formData, actions: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter actions"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Concerns</label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) => setFormData({...formData, concerns: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter concerns"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invite</label>
                <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Staff</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Signed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(member => {
                        const invited = formData.invites?.some(inv => inv.userId === member.id);
                        return (
                          <tr key={member.id} className="border-b border-gray-100">
                            <td className="py-2 px-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={invited}
                                  onChange={() => toggleStaffInvite(member.id)}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-900">
                                  {member.firstName} {member.lastName}
                                </span>
                              </label>
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-500">
                              {invited && formData.invites?.find(inv => inv.userId === member.id)?.signedOn 
                                ? new Date(formData.invites.find(inv => inv.userId === member.id).signedOn).toLocaleString()
                                : '-'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Visit Fields */}
          {['FAMILY_VISIT', 'PROFESSIONAL_VISIT'].includes(entryType) && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Announced</label>
                <select
                  value={formData.announced}
                  onChange={(e) => setFormData({...formData, announced: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                  placeholder="Enter name"
                />
              </div>

              {entryType === 'FAMILY_VISIT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                    placeholder="Enter relationship"
                  />
                </div>
              )}

              {entryType === 'PROFESSIONAL_VISIT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Please Select</option>
                    {professionalRoles.map(role => (
                      <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter purpose"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter summary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Completed</label>
                <select
                  value={formData.completed}
                  onChange={(e) => setFormData({...formData, completed: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>
            </>
          )}

          {/* Event Fields */}
          {entryType === 'EVENT' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Care Worker</label>
                <select
                  value={formData.careWorkerId}
                  onChange={(e) => setFormData({...formData, careWorkerId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Please Select</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event</label>
                <textarea
                  value={formData.eventDescription}
                  onChange={(e) => setFormData({...formData, eventDescription: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
                  placeholder="Enter event description"
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

