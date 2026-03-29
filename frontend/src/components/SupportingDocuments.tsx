'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { FileText, X, UploadCloud, Paperclip, Loader2 } from 'lucide-react';

interface Attachment {
    name: string;
    url: string;
}

interface SupportingDocumentsProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
}

export const SupportingDocuments: React.FC<SupportingDocumentsProps> = ({ attachments, onChange }) => {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const data = await api.post('/generic/upload', formData, token, true);

            if (data.url) {
                const newAttachment = { name: file.name, url: data.url };
                onChange([...attachments, newAttachment]);
            }
        } catch (err: any) {
            console.error('File upload failed:', err);
            alert(`Upload failed: ${err.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                </div>
                <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-4 h-4" />
                            Attach File
                        </>
                    )}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {attachments.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-gray-700 hover:text-indigo-600 truncate"
                                        title={file.name}
                                    >
                                        {file.name}
                                    </a>
                                    <span className="text-[10px] text-gray-600">Supporting Document</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                        <UploadCloud className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No files attached yet. Click "Attach File" to add supporting docs.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
