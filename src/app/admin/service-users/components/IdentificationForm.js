export default function IdentificationForm({ identification, setField, serviceSeekerId, onSave, saving }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">Identification</h2>
      </div>
      
      {/* Form Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">NHS / HSC No.</label>
            <input 
              value={identification.nhsHscNo} 
              onChange={e=>setField('nhsHscNo', e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
              placeholder="Enter NHS / HSC Number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">CHI Number</label>
            <input 
              value={identification.chiNumber} 
              onChange={e=>setField('chiNumber', e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
              placeholder="Enter CHI Number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">NI No.</label>
            <input 
              value={identification.niNumber} 
              onChange={e=>setField('niNumber', e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
              placeholder="Enter NI Number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Person ID</label>
            <input 
              value={identification.personId} 
              onChange={e=>setField('personId', e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
              placeholder="Enter Person ID"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
            <QrControls identification={identification} serviceSeekerId={serviceSeekerId} />
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.(identification)}
            disabled={!!saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
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
    <div className="flex items-center space-x-4">
      {qrDataUrl ? (
        <div className="w-24 h-24 border-2 border-gray-300 rounded-lg p-2 bg-white shadow-sm">
          <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
        </div>
      ) : (
        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm bg-gray-50">QR Code</div>
      )}
      <div className="flex flex-col space-y-2">
        <button 
          type="button" 
          onClick={generateQr} 
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow"
        >
          Generate QR Code
        </button>
        <button 
          type="button" 
          onClick={printQr} 
          disabled={!qrDataUrl}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Print
        </button>
      </div>
    </div>
  );
}


