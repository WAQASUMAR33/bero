'use client';

import { useState } from 'react';

/**
 * Reusable File Upload Component
 * Handles file selection, conversion to base64, and upload to external service
 * 
 * @param {Object} props
 * @param {Function} props.onUploadComplete - Callback when upload completes: (fileUrl, fileName, fileType) => void
 * @param {Function} props.onError - Callback on error: (error) => void
 * @param {string} props.accept - File types to accept (default: "*")
 * @param {string} props.label - Label for the upload button
 * @param {boolean} props.disabled - Disable the upload
 * @param {string} props.className - Additional CSS classes
 */
export default function FileUpload({
  onUploadComplete,
  onError,
  accept = '*',
  label = 'Upload File',
  disabled = false,
  className = ''
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64DataUri = reader.result;
          const token = localStorage.getItem('token');

          // Upload to our API
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ file: base64DataUri })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            if (onUploadComplete) {
              onUploadComplete(result.fileUrl, result.fileName, result.fileType);
            }
            // Reset
            setSelectedFile(null);
            setPreview(null);
            // Reset file input
            const input = document.getElementById(inputId);
            if (input) input.value = '';
          } else {
            const error = result.error || 'Failed to upload file';
            if (onError) {
              onError(error);
            } else {
              alert(error);
            }
          }
        } catch (error) {
          console.error('Upload error:', error);
          if (onError) {
            onError(error.message || 'Failed to upload file');
          } else {
            alert('Failed to upload file');
          }
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        if (onError) {
          onError('Failed to read file');
        }
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('File upload error:', error);
      if (onError) {
        onError(error.message || 'Failed to upload file');
      }
      setIsUploading(false);
    }
  };

  const [inputId] = useState(() => `file-upload-${Date.now()}-${Math.random()}`);

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    const input = document.getElementById(inputId);
    if (input) input.value = '';
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <label
          htmlFor={inputId}
          className={`px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#224fa6] cursor-pointer transition-colors ${
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-sm text-gray-700 font-medium">{label}</span>
        </label>

        {selectedFile && (
          <>
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-[#224fa6] text-white rounded-lg hover:bg-[#224fa6]/90 disabled:opacity-50 text-sm"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border border-gray-200"
          />
        </div>
      )}
    </div>
  );
}

