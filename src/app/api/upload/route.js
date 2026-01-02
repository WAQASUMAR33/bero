'use server';

import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/fileUpload';
import jwt from 'jsonwebtoken';

/**
 * POST /api/upload
 * Upload a file from base64 data URI
 * 
 * Request body:
 * {
 *   "file": "data:application/pdf;base64,JVBERi0xLjQK..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "fileUrl": "https://rizwancars.com/upload_docs/uploads/file_xxx.pdf",
 *   "fileName": "file_xxx.pdf",
 *   "fileType": "application/pdf"
 * }
 */
export async function POST(request) {
  try {
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File data is required' },
        { status: 400 }
      );
    }

    // Validate base64 data URI format
    if (!file.startsWith('data:') || !file.includes(';base64,')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Expected base64 data URI' },
        { status: 400 }
      );
    }

    // Upload file to external service
    const uploadResult = await uploadFile(file);

    if (uploadResult.success) {
      return NextResponse.json({
        success: true,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType
      });
    } else {
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Failed to upload file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

