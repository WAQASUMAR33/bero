export default function IdentificationForm({ identification, setField, serviceSeekerId, onSave, saving }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Identification</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">NHS / HSC No.</label>
          <input value={identification.nhsHscNo} onChange={e=>setField('nhsHscNo', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">CHI Number</label>
          <input value={identification.chiNumber} onChange={e=>setField('chiNumber', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">NI No.</label>
          <input value={identification.niNumber} onChange={e=>setField('niNumber', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Person ID</label>
          <input value={identification.personId} onChange={e=>setField('personId', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-2">QR</label>
          <QrControls identification={identification} serviceSeekerId={serviceSeekerId} />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onSave?.(identification)}
          disabled={!!saving}
          className="px-4 py-2 rounded bg-[#224fa6] text-white disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';

function QrControls({ identification, serviceSeekerId }){
  const [qrDataUrl, setQrDataUrl] = useState('');
  const generateQr = () => {
    import('qrcode').then(qr => {
      const payload = JSON.stringify({
        id: serviceSeekerId,
        personId: identification.personId,
        nhs: identification.nhsHscNo,
        chi: identification.chiNumber,
      });
      qr.toDataURL(payload, { margin: 1, width: 160 }).then(setQrDataUrl).catch(()=>setQrDataUrl(''));
    }).catch(()=>{});
  };

  const printQr = () => {
    if (!qrDataUrl) return;
    const win = window.open('', 'printWindow');
    if (!win) return;
    win.document.write(`<img src="${qrDataUrl}" style="width:160px;height:160px;" />`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="flex items-center space-x-3">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
      ) : (
        <div className="w-20 h-20 border rounded flex items-center justify-center text-gray-400 text-xs">QR</div>
      )}
      <button type="button" onClick={generateQr} className="px-3 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200">Generate QR Code</button>
      <button type="button" onClick={printQr} className="px-3 py-2 rounded border text-gray-700 bg-gray-100 hover:bg-gray-200">Print</button>
    </div>
  );
}


