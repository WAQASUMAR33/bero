'use client';

import { useEffect, useState } from 'react';

export default function OtherAddressesForm({ serviceSeekerId, onNotification }) {
  const [otherAddresses, setOtherAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    addressLine5: '',
    postcode: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const fetchOtherAddresses = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/other-addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOtherAddresses(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOtherAddresses();
  }, [serviceSeekerId]);

  const handleAdd = async () => {
    if (!newAddress.addressType.trim()) {
      onNotification?.({ show: true, message: 'Please fill in address type.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = editingId !== null;
      const url = `/api/service-seekers/${serviceSeekerId}/other-addresses`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...newAddress, id: editingId } : newAddress;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setOtherAddresses(prev => prev.map(item => item.id === editingId ? data : item));
          onNotification?.({ show: true, message: 'Other address updated successfully.', type: 'success' });
        } else {
          setOtherAddresses(prev => [data, ...prev]);
          onNotification?.({ show: true, message: 'Other address added successfully.', type: 'success' });
        }
        setNewAddress({
          addressType: '',
          addressLine1: '',
          addressLine2: '',
          addressLine3: '',
          addressLine4: '',
          addressLine5: '',
          postcode: '',
        });
        setEditingId(null);
        setShowModal(false);
      } else {
        const err = await res.json().catch(() => ({ error: `Failed to ${isEdit ? 'update' : 'add'} other address` }));
        onNotification?.({ show: true, message: err?.error || `Failed to ${isEdit ? 'update' : 'add'} other address.`, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: `Failed to ${editingId ? 'update' : 'add'} other address.`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewAddress({
      addressType: item.addressType || '',
      addressLine1: item.addressLine1 || '',
      addressLine2: item.addressLine2 || '',
      addressLine3: item.addressLine3 || '',
      addressLine4: item.addressLine4 || '',
      addressLine5: item.addressLine5 || '',
      postcode: item.postcode || '',
    });
    setShowModal(true);
  };

  const handleCancel = () => {
    setNewAddress({
      addressType: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      addressLine4: '',
      addressLine5: '',
      postcode: '',
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setAddressToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/other-addresses?id=${addressToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOtherAddresses(prev => prev.filter(item => item.id !== addressToDelete));
        onNotification?.({ show: true, message: 'Other address deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete other address' }));
        onNotification?.({ show: true, message: err?.error || 'Failed to delete other address.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      onNotification?.({ show: true, message: 'Failed to delete other address.', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
        {/* Blue Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Other Addresses</h2>
        </div>
        
        <div className="p-6">

        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : otherAddresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No other addresses added yet.</p>
            <p className="text-sm text-gray-400">Click the Add button to add an address.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Line 1</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Line 2</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Line 3</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Line 4</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address Line 5</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Postcode</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherAddresses.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressType}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressLine1 || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressLine2 || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressLine3 || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressLine4 || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.addressLine5 || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.postcode || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
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
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-gray-600">You can add other addresses for the service user here</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setNewAddress({
                addressType: '',
                addressLine1: '',
                addressLine2: '',
                addressLine3: '',
                addressLine4: '',
                addressLine5: '',
                postcode: '',
              });
              setShowModal(true);
            }}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl text-[#224fa6] font-light transition-colors"
            aria-label="Add other address"
          >
            +
          </button>
        </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{editingId ? 'Edit Other Address' : 'Add Other Address'}</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Add/Edit Form */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address Type</label>
                    <input
                      value={newAddress.addressType}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressType: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="e.g., Previous, Alternate"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address Line 1</label>
                    <input
                      value={newAddress.addressLine1}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter address line 1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                    <input
                      value={newAddress.addressLine2}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter address line 2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address Line 3</label>
                    <input
                      value={newAddress.addressLine3}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressLine3: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter address line 3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address Line 4</label>
                    <input
                      value={newAddress.addressLine4}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressLine4: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter address line 4"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Address Line 5</label>
                    <input
                      value={newAddress.addressLine5}
                      onChange={e => setNewAddress(prev => ({ ...prev, addressLine5: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter address line 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Postcode</label>
                    <input
                      value={newAddress.postcode}
                      onChange={e => setNewAddress(prev => ({ ...prev, postcode: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter postcode"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {saving ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Address' : 'Add Address')}
                  </button>
                </div>
              </div>

              {/* List View */}
              {otherAddresses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Addresses</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Address Type</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Address Line 1</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Address Line 2</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Address Line 3</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Postcode</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherAddresses.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-2 px-3 text-sm text-gray-900">{item.addressType}</td>
                              <td className="py-2 px-3 text-sm text-gray-900">{item.addressLine1 || '-'}</td>
                              <td className="py-2 px-3 text-sm text-gray-900">{item.addressLine2 || '-'}</td>
                              <td className="py-2 px-3 text-sm text-gray-900">{item.addressLine3 || '-'}</td>
                              <td className="py-2 px-3 text-sm text-gray-900">{item.postcode || '-'}</td>
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(item)}
                                    className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Other Address
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

