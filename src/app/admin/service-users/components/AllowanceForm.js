'use client';

import { useEffect, useState, useRef } from 'react';

export default function AllowanceForm({ serviceSeekerId, onNotification }) {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ receivesAllowance: false, allowanceAmount: 0, allowanceFrequency: null });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [formData, setFormData] = useState({ transaction: 'Credit', amount: '', item: '', isAllowance: false });
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchAll();
  }, [serviceSeekerId]);

  const fetchAll = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/service-seekers/${serviceSeekerId}/allowance-transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/service-seekers/${serviceSeekerId}/allowance-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (tRes.ok) setTransactions(await tRes.json());
      if (sRes.ok) {
        const s = await sRes.json();
        setSettings(s);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '-';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return s || '-';
    }
  };

  const formatCurrency = (amount) => {
    return `£${parseFloat(amount || 0).toFixed(2)}`;
  };

  const openAdd = () => {
    setFormData({ transaction: 'Credit', amount: '', item: '', isAllowance: false });
    setSignatureDataUrl('');
    setShowModal(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/allowance-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await fetchAll();
        if (onNotification)
          onNotification({ show: true, message: 'Allowance settings saved.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveTransaction = async () => {
    if (!formData.amount) {
      if (onNotification)
        onNotification({ show: true, message: 'Please enter an amount.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/allowance-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          signature: signatureDataUrl || null,
        }),
      });
      if (res.ok) {
        await fetchAll();
        setShowModal(false);
        setFormData({ transaction: 'Credit', amount: '', item: '', isAllowance: false });
        setSignatureDataUrl('');
        if (onNotification)
          onNotification({ show: true, message: 'Transaction saved.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to save transaction.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteTransactions = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/service-seekers/${serviceSeekerId}/allowance-transactions?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      await fetchAll();
      setSelectedIds([]);
      if (onNotification)
        onNotification({ show: true, message: 'Transactions deleted.', type: 'success' });
    } catch (e) {
      console.error(e);
      if (onNotification)
        onNotification({ show: true, message: 'Failed to delete.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openSignatureModal = (existingSignature = null) => {
    if (existingSignature) {
      setSignatureDataUrl(existingSignature);
    }
    setShowSignatureModal(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (existingSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = existingSignature;
        }
      }
    }, 100);
  };

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getEventPos(e);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getEventPos(e);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
  };

  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [showSignatureModal]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-orange-500">
      {/* Orange Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Allowance</h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Transaction</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Amount</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Balance</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Allowance?</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Item</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Service User Signature</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Created</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-700 border-b border-gray-200">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-4 px-5 text-sm text-gray-900">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, t.id]);
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== t.id));
                              }
                            }}
                            className="mr-3 w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                          />
                          <span className="font-medium">{t.transaction}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-900 font-medium">{formatCurrency(t.amount)}</td>
                      <td className="py-4 px-5 text-sm text-gray-900 font-medium">{formatCurrency(t.balance)}</td>
                      <td className="py-4 px-5 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.isAllowance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {t.isAllowance ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-900">{t.item || '-'}</td>
                      <td className="py-4 px-5 text-sm">
                        {t.signature ? (
                          <img 
                            src={t.signature} 
                            alt="Signature" 
                            className="w-24 h-12 object-contain border-2 border-gray-300 rounded cursor-pointer hover:border-orange-500 transition-colors" 
                            onClick={() => openSignatureModal(t.signature)} 
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSignatureModal()}
                            className="text-[#224fa6] hover:text-[#1a3d85] text-sm font-medium underline transition-colors"
                          >
                            Sign
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-600">{formatDate(t.createdAt)}</td>
                      <td className="py-4 px-5 text-sm text-gray-600">{formatDate(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={deleteTransactions}
                  disabled={selectedIds.length === 0 || saving}
                  className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete selected"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.receivesAllowance}
                    onChange={(e) => {
                      setSettings({ ...settings, receivesAllowance: e.target.checked });
                    }}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Receives allowance</span>
                </label>
                {settings.receivesAllowance && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">of £</span>
                    <input
                      type="number"
                      value={settings.allowanceAmount || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, allowanceAmount: parseFloat(e.target.value) || 0 });
                      }}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-700">per</span>
                    <select
                      value={settings.allowanceFrequency || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, allowanceFrequency: e.target.value });
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Please Select</option>
                      <option value="week">week</option>
                      <option value="month">month</option>
                      <option value="year">year</option>
                    </select>
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={saving}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={openAdd}
                className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center hover:from-orange-600 hover:to-orange-700 text-2xl font-light shadow-lg hover:shadow-xl transition-all"
                title="Add new transaction"
              >
                +
              </button>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add Transaction</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction:</label>
                <select
                  value={formData.transaction}
                  onChange={(e) => setFormData({ ...formData, transaction: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item:</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter item"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowance?:</label>
                <select
                  value={formData.isAllowance ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isAllowance: e.target.value === 'true' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service User Signature:</label>
                <div>
                  {signatureDataUrl ? (
                    <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                      <img src={signatureDataUrl} alt="Signature" className="w-full h-24 object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureDataUrl('');
                          openSignatureModal();
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Re-sign
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openSignatureModal}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                    >
                      Tap to sign
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormData({ transaction: 'Credit', amount: '', item: '', isAllowance: false });
                  setSignatureDataUrl('');
                }}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTransaction}
                disabled={saving || !formData.amount}
                className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Sign</h3>
            </div>
            <div className="p-6">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="border-2 border-gray-300 rounded-lg cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={clearSignature}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

