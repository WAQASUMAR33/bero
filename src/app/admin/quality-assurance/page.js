'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function QualityAssurancePage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [serviceSeekers, setServiceSeekers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const entryTypes = [
    { value: 'COMPLIMENT', label: 'Compliment' },
    { value: 'SUGGESTION', label: 'Suggestion' },
    { value: 'CONCERN', label: 'Concern' }
  ];

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CLOSED', label: 'Closed' }
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

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/quality-assurance?${params.toString()}`, {
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

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [filterType, filterStatus, user]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quality-assurance/${id}`, {
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
      case 'COMPLIMENT':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        );
      case 'SUGGESTION':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'CONCERN':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'CLOSED': 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(34, 79, 166); // #224fa6
      doc.text('Feedback Monitoring Report', 14, 20);
      
      // Date generated
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 14, 28);
      
      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Entries: ${filteredEntries.length}`, 14, 38);
      
      // Group entries by type for summary
      const typeCounts = {
        'COMPLIMENT': filteredEntries.filter(e => e.type === 'COMPLIMENT').length,
        'SUGGESTION': filteredEntries.filter(e => e.type === 'SUGGESTION').length,
        'CONCERN': filteredEntries.filter(e => e.type === 'CONCERN').length
      };
      
      doc.text(`Compliments: ${typeCounts.COMPLIMENT} | Suggestions: ${typeCounts.SUGGESTION} | Concerns: ${typeCounts.CONCERN}`, 14, 45);
      
      let yPosition = 55;
      
      // Add each entry
      filteredEntries.forEach((entry, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Entry header
        doc.setFontSize(14);
        doc.setTextColor(34, 79, 166);
        doc.text(`Entry ${index + 1}: ${getEntryTypeLabel(entry.type)}`, 14, yPosition);
        yPosition += 8;
        
        // Entry details
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const details = [
          [`Date:`, new Date(entry.date).toLocaleDateString('en-GB')],
          [`From:`, entry.from || 'N/A'],
          [`Status:`, statusOptions.find(s => s.value === entry.status)?.label || entry.status],
          [`Created By:`, entry.createdBy ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : 'N/A'],
          [`Created At:`, entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-GB') : 'N/A'],
          [`Updated By:`, entry.updatedBy ? `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}` : 'N/A'],
          [`Updated At:`, entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString('en-GB') : 'N/A'],
        ];
        
        details.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 14, yPosition);
          doc.setFont('helvetica', 'normal');
          const textWidth = doc.getTextWidth(value);
          const maxWidth = 180;
          if (textWidth > maxWidth) {
            const lines = doc.splitTextToSize(value, maxWidth);
            doc.text(lines, 50, yPosition);
            yPosition += (lines.length - 1) * 5;
          } else {
            doc.text(value, 50, yPosition);
          }
          yPosition += 6;
        });
        
        // You Said
        if (entry.youSaid) {
          doc.setFont('helvetica', 'bold');
          doc.text('You Said:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const youSaidLines = doc.splitTextToSize(entry.youSaid, 180);
          doc.text(youSaidLines, 14, yPosition);
          yPosition += youSaidLines.length * 5 + 3;
        }
        
        // We Did
        if (entry.weDid) {
          doc.setFont('helvetica', 'bold');
          doc.text('We Did:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const weDidLines = doc.splitTextToSize(entry.weDid, 180);
          doc.text(weDidLines, 14, yPosition);
          yPosition += weDidLines.length * 5 + 3;
        }
        
        // Lessons Learnt
        if (entry.lessonsLearnt) {
          doc.setFont('helvetica', 'bold');
          doc.text('Lessons Learnt:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const lessonsLines = doc.splitTextToSize(entry.lessonsLearnt, 180);
          doc.text(lessonsLines, 14, yPosition);
          yPosition += lessonsLines.length * 5 + 3;
        }
        
        // Separator line
        yPosition += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 10;
      });
      
      // Save the PDF
      const fileName = `Quality_Assurance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      showNotification('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Error generating PDF. Please try again.', 'error');
    }
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const from = (entry.from || '').toLowerCase();
      const youSaid = (entry.youSaid || '').toLowerCase();
      const weDid = (entry.weDid || '').toLowerCase();
      const lessonsLearnt = (entry.lessonsLearnt || '').toLowerCase();
      const typeLabel = getEntryTypeLabel(entry.type).toLowerCase();

      if (
        !from.includes(q) &&
        !youSaid.includes(q) &&
        !weDid.includes(q) &&
        !lessonsLearnt.includes(q) &&
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
                <p className="text-gray-600">Loading feedback monitoring entries...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Monitoring</h1>
                    <p className="text-gray-600">Manage compliments, suggestions, and concerns</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleExportPDF}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Save as PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEntry(null);
                        setShowAddModal(true);
                      }}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Entry</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                        placeholder="Search by type, from, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Type filter */}
                  <div className="md:col-span-1">
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

                  {/* Status filter */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">You Said</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated By</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                            No entries found. Click &quot;Add Entry&quot; to create one.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="text-[#224fa6]">
                                  {getEntryTypeIcon(entry.type)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getEntryTypeLabel(entry.type)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.from || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm text-gray-900 max-w-md truncate">
                                {entry.youSaid || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(entry.date).toLocaleDateString('en-GB')}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                                {statusOptions.find(s => s.value === entry.status)?.label || entry.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.createdBy ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : '-'}
                              </div>
                              {entry.createdBy && (
                                <div className="text-xs text-gray-500">
                                  {new Date(entry.createdAt).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.updatedBy ? `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}` : '-'}
                              </div>
                              {entry.updatedBy && (
                                <div className="text-xs text-gray-500">
                                  {new Date(entry.updatedAt).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedEntry(entry);
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

          {/* Add/Edit Entry Modal */}
          {showAddModal && (
            <QualityAssuranceFormModal
              entry={selectedEntry}
              serviceSeekers={serviceSeekers}
              onClose={() => {
                setShowAddModal(false);
                setSelectedEntry(null);
              }}
              onSave={async (formData) => {
                try {
                  setIsSubmitting(true);
                  const token = localStorage.getItem('token');
                  const url = selectedEntry 
                    ? `/api/quality-assurance/${selectedEntry.id}`
                    : '/api/quality-assurance';
                  const method = selectedEntry ? 'PUT' : 'POST';

                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    showNotification(selectedEntry ? 'Entry updated successfully!' : 'Entry created successfully!', 'success');
                    setShowAddModal(false);
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

// Quality Assurance Form Modal Component
function QualityAssuranceFormModal({ entry, serviceSeekers, onClose, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    date: entry ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: entry?.type || '',
    from: entry?.from || '',
    youSaid: entry?.youSaid || '',
    weDid: entry?.weDid || '',
    lessonsLearnt: entry?.lessonsLearnt || '',
    status: entry?.status || 'OPEN'
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: new Date(entry.date).toISOString().split('T')[0],
        type: entry.type,
        from: entry.from || '',
        youSaid: entry.youSaid || '',
        weDid: entry.weDid || '',
        lessonsLearnt: entry.lessonsLearnt || '',
        status: entry.status || 'OPEN'
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: '',
        from: '',
        youSaid: '',
        weDid: '',
        lessonsLearnt: '',
        status: 'OPEN'
      });
    }
  }, [entry]);

  const entryTypes = [
    { value: 'COMPLIMENT', label: 'Compliment' },
    { value: 'SUGGESTION', label: 'Suggestion' },
    { value: 'CONCERN', label: 'Concern' }
  ];

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{entry ? 'Edit Entry' : 'Add Entry'}</h3>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Please Select</option>
                {entryTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
            <input
              type="text"
              required
              value={formData.from}
              onChange={(e) => setFormData({...formData, from: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
              placeholder="Enter name or source"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">You said</label>
            <textarea
              value={formData.youSaid}
              onChange={(e) => setFormData({...formData, youSaid: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
              placeholder="Enter what was said"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">We did</label>
            <textarea
              value={formData.weDid}
              onChange={(e) => setFormData({...formData, weDid: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
              placeholder="Enter what was done"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lessons Learnt</label>
            <textarea
              value={formData.lessonsLearnt}
              onChange={(e) => setFormData({...formData, lessonsLearnt: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 resize-y"
              placeholder="Enter lessons learnt"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

