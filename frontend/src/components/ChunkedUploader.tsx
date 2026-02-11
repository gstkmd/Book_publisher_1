'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export const ChunkedUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const { token } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(0);
        setUploadedUrl('');

        try {
            // 1. Init
            const initData = await api.post('/generic/upload/multipart/init', {
                file_name: file.name,
                content_type: file.type
            }, token || undefined);

            const { uploadId, fileName } = initData;
            const parts = [];
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

            // 2. Upload Parts
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('upload_id', uploadId);
                formData.append('file_name', fileName);
                formData.append('part_number', (chunkIndex + 1).toString());
                formData.append('file', chunk);

                // Use fetch directly for FormData to avoid Content-Type issues if api wrapper is strict
                const res = await fetch('http://localhost:8000/api/v1/generic/upload/multipart/part', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (!res.ok) throw new Error('Part upload failed');
                const partData = await res.json();

                parts.push({ PartNumber: chunkIndex + 1, ETag: partData.ETag });
                setProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
            }

            // 3. Complete
            const completeData = await api.post('/generic/upload/multipart/complete', {
                upload_id: uploadId,
                file_name: fileName,
                parts: parts
            }, token || undefined);

            setUploadedUrl(completeData.url);
            alert('Upload Complete!');

        } catch (error) {
            console.error(error);
            alert('Upload Failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded bg-white shadow-sm max-w-md">
            <h3 className="font-bold mb-4">Large File Uploader (Chunked)</h3>
            <div className="mb-4">
                <input type="file" onChange={handleFileChange} />
            </div>
            {file && (
                <div className="mb-2 text-sm text-gray-600">
                    Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
            )}
            <button
                onClick={uploadFile}
                disabled={!file || uploading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
                {uploading ? `Uploading... ${progress}%` : 'Start Upload'}
            </button>
            {uploadedUrl && (
                <div className="mt-4 p-2 bg-green-50 text-green-800 text-sm break-all rounded">
                    File URL: <a href={uploadedUrl} target="_blank" rel="noreferrer" className="underline">{uploadedUrl}</a>
                </div>
            )}
        </div>
    );
};
