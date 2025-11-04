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
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="bg-teal-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Allowance</h2>
          <span className="text-white text-lg">▼</span>
          <span className="text-white text-lg">ℹ️</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Transaction</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Allowance?</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Service User Signature</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">Modified</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`border-b ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
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
                        className="mr-2"
                      />
                      {t.transaction}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(t.amount)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(t.balance)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{t.isAllowance ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{t.item || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      {t.signature ? (
                        <img src={t.signature} alt="Signature" className="w-24 h-12 object-contain border border-gray-300 cursor-pointer" onClick={() => openSignatureModal(t.signature)} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSignatureModal()}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Sign
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={deleteTransactions}
                disabled={selectedIds.length === 0 || saving}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️
              </button>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.receivesAllowance}
                  onChange={(e) => {
                    setSettings({ ...settings, receivesAllowance: e.target.checked });
                  }}
                />
                <span className="text-sm text-gray-700">Receives allowance</span>
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
                    className="w-20 border rounded px-2 py-1 text-sm text-gray-900"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-700">per</span>
                  <select
                    value={settings.allowanceFrequency || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, allowanceFrequency: e.target.value });
                    }}
                    className="border rounded px-2 py-1 text-sm text-gray-900"
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
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 text-xl"
            >
              +
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white text-lg">ℹ️</span>
                <h3 className="text-xl font-semibold">Add Transaction</h3>
              </div>
              <span className="text-white text-lg">📤</span>
            </div>
            <div className="p-6 bg-white space-y-4">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Transaction:</label>
                <select
                  value={formData.transaction}
                  onChange={(e) => setFormData({ ...formData, transaction: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Item:</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="Enter item"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Allowance?:</label>
                <select
                  value={formData.isAllowance ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isAllowance: e.target.value === 'true' })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="flex items-start space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32">Service Users Signature:</label>
                <div className="flex-1">
                  {signatureDataUrl ? (
                    <div className="border border-gray-300 rounded-lg p-2">
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

