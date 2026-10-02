'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/app/admin/components/FileUpload';

export default function BlogManager({ showNotification }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    publishedAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/staff-area/blog', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      } else {
        showNotification(data.error || 'Failed to load blog posts', 'error');
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      showNotification('Failed to load blog posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      coverImage: '',
      publishedAt: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const handleImageUpload = (url) => {
    setFormData((prev) => ({ ...prev, coverImage: url }));
    showNotification('Cover image uploaded successfully!', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter a post title', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showNotification('Please enter blog post content', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const url = editingPost
        ? `/api/staff-area/blog/${editingPost.id}`
        : '/api/staff-area/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(
          editingPost ? 'Post updated successfully!' : 'Post published successfully!',
          'success'
        );
        setShowAddModal(false);
        fetchPosts();
      } else {
        showNotification(data.error || 'Failed to save post', 'error');
      }
    } catch (err) {
      console.error('Error saving post:', err);
      showNotification('Failed to save post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete post "${title}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/staff-area/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Post deleted successfully', 'success');
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (selectedPost?.id === id) setSelectedPost(null);
      } else {
        showNotification(data.error || 'Failed to delete post', 'error');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      showNotification('Failed to delete post', 'error');
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.content && p.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search & Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 w-full sm:max-w-md relative">
          <input
            type="text"
            placeholder="Search blog posts..."
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
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          New Blog Post
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-[#224fa6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Blog Posts Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Share news, best practices, celebrations, and team announcements with your care team.
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#224fa6] text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition"
            >
              Write First Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Cover image if available */}
                {post.coverImage ? (
                  <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-400 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {post.likesCount}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-r from-blue-500/10 via-[#224fa6]/10 to-indigo-500/10 p-4 flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-blue-700 bg-white/80 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      Company Blog
                    </span>
                    <span className="bg-white/80 backdrop-blur-md text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {post.likesCount}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-gray-600">
                      {post.createdBy ? `${post.createdBy.firstName} ${post.createdBy.lastName}` : 'Management'}
                    </span>
                  </div>

                  <h4
                    onClick={() => setSelectedPost(post)}
                    className="text-base font-bold text-gray-900 group-hover:text-[#224fa6] transition-colors mb-2 line-clamp-2 cursor-pointer"
                  >
                    {post.title}
                  </h4>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                    {post.excerpt || post.content}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPost(post)}
                  className="text-xs font-semibold text-[#224fa6] hover:underline inline-flex items-center gap-1"
                >
                  Read full post
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(post)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit post"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete post"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 transition-all transform animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Published to the Staff Area blog for all care staff to read and like
                </p>
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

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 sleek-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Article Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Celebrating Our Outstanding CQC Preparation & Team Recognition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    Cover Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Or Upload Cover Image
                </label>
                <FileUpload
                  accept="image/*"
                  label="Select Image"
                  onUploadComplete={handleImageUpload}
                  onError={(err) => showNotification(err, 'error')}
                />
                {formData.coverImage && (
                  <div className="mt-2.5 relative h-28 w-full rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: '' })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-md transition"
                      title="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Summary / Excerpt (Optional)
                </label>
                <input
                  type="text"
                  placeholder="One sentence synopsis that displays on blog preview cards..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Article Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write the full post here... Paragraphs, updates, team shout-outs, policies, etc."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#224fa6] focus:border-transparent outline-none transition leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#224fa6] to-[#3270e9] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editingPost ? (
                    'Save Changes'
                  ) : (
                    'Publish Article'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#224fa6] flex items-center justify-center font-bold text-sm">
                  {selectedPost.createdBy?.firstName?.[0] || 'M'}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-900">
                    {selectedPost.createdBy ? `${selectedPost.createdBy.firstName} ${selectedPost.createdBy.lastName}` : 'Management'}
                  </h5>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedPost.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 sleek-scrollbar space-y-5">
              {selectedPost.coverImage && (
                <div className="rounded-2xl overflow-hidden max-h-72 w-full bg-gray-100">
                  <img
                    src={selectedPost.coverImage}
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {selectedPost.title}
              </h2>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {selectedPost.likesCount} staff reactions
                </span>
              </div>

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-5 font-normal">
                {selectedPost.content}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-gray-400">
                Staff Area Company Blog
              </span>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
