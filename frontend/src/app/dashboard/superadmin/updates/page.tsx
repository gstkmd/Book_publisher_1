'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Upload, FileText, Trash2, Shield, RefreshCw, AlertCircle } from 'lucide-react';

interface UpdateFile {
    filename: string;
    size: number;
    size_formatted: string;
    modified: string;
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function SoftwareUpdateManager() {
    const { token } = useAuth();
    const [files, setFiles] = useState<UpdateFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/superadmin/updates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch files');
            const data = await res.json();
            setFiles(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            setError(null);
            const res = await fetch(`${API_BASE}/superadmin/updates/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            await fetchFiles();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}? This will stop auto-updates for agents looking for this file.`)) return;

        try {
            const res = await fetch(`${API_BASE}/superadmin/updates/${filename}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            await fetchFiles();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Software Update Manager</h1>
                    <p className="text-gray-500 mt-1">Deploy new versions of the Monitoring Agent to all users.</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <Shield className="text-blue-600" size={20} />
                    <span className="text-sm font-bold text-blue-700">Super Admin Only</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload size={20} className="text-blue-500" />
                            Upload Release Files
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Upload the <code className="bg-gray-100 px-1 rounded text-blue-600">latest.yml</code> and the <code className="bg-gray-100 px-1 rounded text-blue-600">.exe</code> setup from your <code className="bg-gray-100 px-1 rounded text-blue-600">dist</code> folder.
                        </p>

                        <label className={`
                            flex flex-col items-center justify-center w-full h-48 
                            border-2 border-dashed rounded-xl cursor-pointer
                            transition-all duration-200
                            ${uploading ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'bg-blue-50/30 border-blue-200 hover:bg-blue-50 hover:border-blue-400'}
                        `}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploading ? (
                                    <RefreshCw className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                                ) : (
                                    <Upload className="w-10 h-10 mb-3 text-blue-400" />
                                )}
                                <p className="mb-2 text-sm text-gray-700 font-bold">
                                    {uploading ? 'Uploading...' : 'Click to upload file'}
                                </p>
                                <p className="text-xs text-gray-500">.exe, .yml, or .blockmap</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={handleUpload} 
                                disabled={uploading}
                                accept=".exe,.yml,.blockmap"
                            />
                        </label>
                    </div>

                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
                        <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Deployment Guide
                        </h3>
                        <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
                            <li>Run <code className="bg-amber-100 px-1 rounded">npm run build:win</code> in the agent project.</li>
                            <li>Upload the <code className="bg-amber-100 px-1 rounded">latest.yml</code> first.</li>
                            <li>Upload the <code className="bg-amber-100 px-1 rounded">.exe</code> setup file.</li>
                            <li>Once both are present, agents will automatically start downloading the update.</li>
                        </ul>
                    </div>
                </div>

                {/* File List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Current Release Repository</h2>
                            <button 
                                onClick={fetchFiles}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Last Modified</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading && files.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                                                Loading repository...
                                            </td>
                                        </tr>
                                    ) : files.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                No update files uploaded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        files.map((file) => (
                                            <tr key={file.filename} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${file.filename.endsWith('.yml') ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            <FileText size={18} />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                                                            {file.filename}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {file.size_formatted}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(file.modified).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(file.filename)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete File"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
