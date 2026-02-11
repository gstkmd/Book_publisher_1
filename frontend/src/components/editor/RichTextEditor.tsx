'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface RichTextEditorProps {
    initialValue?: any;
    onChange?: (value: any) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onChange }) => {
    const [jsonContent, setJsonContent] = useState<string>(
        JSON.stringify(initialValue || { type: 'doc', content: [] }, null, 2)
    );
    const [uploading, setUploading] = useState(false);
    const { token } = useAuth();

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setJsonContent(newValue);
        try {
            const parsed = JSON.parse(newValue);
            if (onChange) onChange(parsed);
        } catch (err) {
            // Invalid JSON, don't propagate change yet
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploading(true);

        try {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/generic/upload', formData, token || undefined, true);

            // Insert image logic (for now, just append to JSON)
            try {
                const current = JSON.parse(jsonContent);
                if (!current.content) current.content = [];
                current.content.push({
                    type: 'image',
                    attrs: { src: res.url, alt: file.name }
                });
                const newJson = JSON.stringify(current, null, 2);
                setJsonContent(newJson);
                if (onChange) onChange(current);
            } catch {
                alert('Could not insert image into invalid JSON structure');
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="mb-2 flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-gray-700">Rich Text (JSON Mode)</span>
                <label className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded cursor-pointer">
                    {uploading ? 'Uploading...' : 'Insert Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
            </div>

            <textarea
                className="w-full h-64 font-mono text-sm p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={jsonContent}
                onChange={handleJsonChange}
                placeholder='{"type": "doc", "content": []}'
            />
            <p className="text-xs text-gray-500 mt-2">
                * This is a raw JSON editor simulating a ProseMirror document structure.
                Images uploaded are added as nodes.
            </p>
        </div>
    );
};
