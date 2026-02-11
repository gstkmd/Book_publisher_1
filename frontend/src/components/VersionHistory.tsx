'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Version {
    _id: string;
    version_number: number;
    created_at: string;
    title: string;
}

interface VersionHistoryProps {
    contentId: string;
    onRestore: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ contentId, onRestore }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const fetchVersions = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}/versions`, token || undefined);
            setVersions(data);
        } catch (error) {
            console.error("Failed to fetch versions", error);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, [contentId]);

    const handleRestore = async (versionId: string) => {
        if (!confirm("Are you sure you want to restore this version? Current changes will be overwritten.")) return;
        setLoading(true);
        try {
            await api.post(`/generic/content/${contentId}/restore/${versionId}`, {}, token || undefined);
            alert("Version restored successfully!");
            onRestore(); // Refresh parent
            fetchVersions(); // Refresh list (new version created by restore?)
        } catch (error) {
            console.error("Failed to restore", error);
            alert("Failed to restore version.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-l bg-gray-50 h-full flex flex-col w-64">
            <div className="p-4 border-b bg-white flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">History</h3>
                <button onClick={fetchVersions} className="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {versions.length === 0 && <p className="text-gray-400 text-sm text-center mt-4">No revisions found.</p>}
                {versions.map((v) => (
                    <div key={v._id} className="bg-white p-3 rounded shadow-sm border text-sm group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800">Version {v.version_number}</span>
                            <span className="text-xs text-gray-500">{new Date(v.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate">{new Date(v.created_at).toLocaleTimeString()}</div>
                        <button
                            onClick={() => handleRestore(v._id)}
                            disabled={loading}
                            className="w-full py-1 bg-gray-100 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 transition text-xs opacity-0 group-hover:opacity-100"
                        >
                            Restore
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
