'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/app/admin/components/FileUpload';

export default function NewsletterManager({ showNotification }) {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    publishedAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff-area/newsletters', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNewsletters(data.data || []);
      } else {
        showNotification(data.error || 'Failed to load newsletters', 'error');
      }
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      showNotification('Failed to load newsletters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (url, name, type) => {
    setFormData((prev) => ({
      ...prev,
      fileUrl: url,
      fileName: name,
    }));
    showNotification('PDF uploaded successfully!', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter a newsletter title', 'error');
      return;
    }
    if (!formData.fileUrl) {
      showNotification('Please upload a newsletter PDF file', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff-area/newsletters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('Newsletter published successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          title: '',
          description: '',
          fileUrl: '',
          fileName: '',
          fileSize: '',
          publishedAt: new Date().toISOString().split('T')[0],
        });
        fetchNewsletters();
      } else {
        showNotification(data.error || 'Failed to publish newsletter', 'error');
      }
    } catch (err) {
      console.error('Error submitting newsletter:', err);
      showNotification('Failed to publish newsletter', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/staff-area/newsletters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Newsletter deleted successfully', 'success');
        setNewsletters((prev) => prev.filter((n) => n.id !== id));
      } else {
        showNotification(data.error || 'Failed to delete newsletter', 'error');
      }
    } catch (err) {
      console.error('Error deleting newsletter:', err);
      showNotification('Failed to delete newsletter', 'error');
    }
  };

  const filteredNewsletters = newsletters.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 w-full sm:max-w-md relative">
          <input
            type="text"
            placeholder="Search newsletters by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all outline-none"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Newsletter
        </button>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
        </div>
      ) : filteredNewsletters.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Newsletters Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {searchTerm
              ? 'No newsletters matched your search query.'
              : 'Upload company newsletters and monthly editions for your staff to read and download.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#224fa6] text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition"
            >
              Upload First Newsletter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNewsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        PDF Publication
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(newsletter.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(newsletter.id, newsletter.title)}
                    className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete newsletter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <h4 className="text-base font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors mb-2 line-clamp-1">
                  {newsletter.title}
                </h4>

                {newsletter.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                    {newsletter.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400 truncate max-w-[150px]">
                  By {newsletter.createdBy ? `${newsletter.createdBy.firstName} ${newsletter.createdBy.lastName}` : 'Management'}
                </div>

                <a
                  href={newsletter.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#224fa6] bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                  </svg>
                  View / Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 transition-all transform animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload Staff Newsletter</h3>
                <p className="text-xs text-gray-500 mt-0.5">Publish a monthly or quarterly newsletter in PDF format</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Newsletter Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn 2026 Staff Bulletin"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Highlights (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of highlights, birthdays, policy updates, etc..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Upload PDF Document <span className="text-red-500">*</span>
                </label>
                <FileUpload
                  accept="application/pdf,.pdf"
                  label="Select PDF Newsletter"
                  onUploadComplete={handleFileUpload}
                  onError={(err) => showNotification(err, 'error')}
                />
                {formData.fileUrl && (
                  <div className="mt-2.5 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold truncate">{formData.fileName || 'Newsletter.pdf'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-green-600 uppercase">Ready</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.fileUrl}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Newsletter'
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
