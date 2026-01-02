/**
 * File Upload Utility
 * Handles file uploads to external upload service
 */

const UPLOAD_API_URL = 'https://rizwancars.com/upload_docs/upload_file.php';

/**
 * Upload a file from base64 data URI
 * @param {string} base64DataUri - Base64 data URI (e.g., "data:application/pdf;base64,...")
 * @returns {Promise<{success: boolean, fileUrl?: string, error?: string}>}
 */
export async function uploadFile(base64DataUri) {
  try {
    // Extract base64 string from data URI
    // Format: "data:application/pdf;base64,JVBERi0xLjQK..."
    const base64Match = base64DataUri.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!base64Match) {
      return {
        success: false,
        error: 'Invalid base64 data URI format. Expected format: data:mime/type;base64,<data>'
      };
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    // Send to upload API
    const response = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64DataUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload API error:', errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();

    if (result.status && result.file_url) {
      return {
        success: true,
        fileUrl: result.file_url,
        fileName: result.file_name,
        fileType: result.file_type
      };
    } else {
      return {
        success: false,
        error: result.message || 'Upload failed: Invalid response from server'
      };
    }
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
}

/**
 * Convert File object to base64 data URI
 * @param {File} file - File object from input
 * @returns {Promise<string>} Base64 data URI
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a File object (converts to base64 first, then uploads)
 * @param {File} file - File object from input
 * @returns {Promise<{success: boolean, fileUrl?: string, error?: string}>}
 */
export async function uploadFileObject(file) {
  try {
    const base64DataUri = await fileToBase64(file);
    return await uploadFile(base64DataUri);
  } catch (error) {
    console.error('File conversion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process file'
    };
  }
}

