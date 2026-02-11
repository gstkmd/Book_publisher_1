'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ContentVersionsPage() {
    const { token } = useAuth();
    const params = useParams();
    const contentId = params.id as string;
    const [content, setContent] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [compareMode, setCompareMode] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

    useEffect(() => {
        if (token && contentId) {
            fetchContent();
            fetchVersions();
        }
    }, [token, contentId]);

    const fetchContent = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}`, token!);
            setContent(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchVersions = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}/versions`, token!);
            setVersions(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRestore = async (versionId: string) => {
        if (!confirm('Restore this version?')) return;
        try {
            await api.post(`/generic/content/${contentId}/restore/${versionId}`, {}, token!);
            alert('Version restored!');
            fetchContent();
            fetchVersions();
        } catch (err) {
            console.error(err);
            alert('Failed to restore version');
        }
    };

    const handleVersionSelect = (versionId: string) => {
        if (selectedVersions.includes(versionId)) {
            setSelectedVersions(selectedVersions.filter(id => id !== versionId));
        } else if (selectedVersions.length < 2) {
            setSelectedVersions([...selectedVersions, versionId]);
        } else {
            // Replace the first selection
            setSelectedVersions([selectedVersions[1], versionId]);
        }
    };

    const getComparedVersions = () => {
        if (selectedVersions.length !== 2) return null;
        const v1 = versions.find(v => v._id === selectedVersions[0]);
        const v2 = versions.find(v => v._id === selectedVersions[1]);
        return v1 && v2 ? [v1, v2].sort((a, b) => a.version_number - b.version_number) : null;
    };

    if (!content) {
        return <div className="container mx-auto p-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6">
                <Link href="/dashboard/library" className="text-blue-600 hover:underline mb-4 inline-block">
                    ← Back to Library
                </Link>
                <h1 className="text-3xl font-bold">{content.title}</h1>
                <p className="text-gray-600">Version History</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Current Version</h2>
                <div className="prose max-w-none">
                    {content.body?.ops ? (
                        <div>Rich content preview</div>
                    ) : (
                        <div className="text-gray-600">No content body</div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Version History ({versions.length})</h2>
                    {versions.length > 1 && (
                        <button
                            onClick={() => {
                                setCompareMode(!compareMode);
                                setSelectedVersions([]);
                            }}
                            className={`px-4 py-2 rounded text-sm font-medium ${compareMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {compareMode ? 'Exit Compare' : 'Compare Versions'}
                        </button>
                    )}
                </div>

                {compareMode && selectedVersions.length === 2 && (() => {
                    const compared = getComparedVersions();
                    if (!compared) return null;
                    const [older, newer] = compared;
                    return (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="font-bold mb-3 text-blue-900">Comparing Versions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-semibold text-gray-700">Version {older.version_number}</div>
                                    <div className="text-xs text-gray-500">{new Date(older.created_at).toLocaleString()}</div>
                                    {older.title !== newer.title && (
                                        <div className="mt-2">
                                            <div className="text-xs text-gray-600">Title:</div>
                                            <div className="text-sm bg-red-50 border-l-4 border-red-400 p-2 mt-1">
                                                {older.title}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-700">Version {newer.version_number}</div>
                                    <div className="text-xs text-gray-500">{new Date(newer.created_at).toLocaleString()}</div>
                                    {older.title !== newer.title && (
                                        <div className="mt-2">
                                            <div className="text-xs text-gray-600">Title:</div>
                                            <div className="text-sm bg-green-50 border-l-4 border-green-400 p-2 mt-1">
                                                {newer.title}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {JSON.stringify(older.body) !== JSON.stringify(newer.body) && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="text-xs text-gray-600 mb-2">Content Changes</div>
                                    <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-96 overflow-auto">
                                        {(() => {
                                            // Extract text content from Rich Text JSON
                                            const extractText = (body: any): string => {
                                                if (!body) return '';
                                                if (typeof body === 'string') return body;
                                                if (body.content && Array.isArray(body.content)) {
                                                    return body.content.map((node: any) => {
                                                        if (node.type === 'text') return node.text || '';
                                                        if (node.content) return extractText(node);
                                                        if (node.text) return node.text;
                                                        return '';
                                                    }).join('');
                                                }
                                                return JSON.stringify(body);
                                            };

                                            const oldText = extractText(older.body);
                                            const newText = extractText(newer.body);

                                            // Simple line-by-line diff
                                            const oldLines = oldText.split(/[\n.!?]+/).filter(l => l.trim());
                                            const newLines = newText.split(/[\n.!?]+/).filter(l => l.trim());

                                            const changes: any[] = [];
                                            const maxLen = Math.max(oldLines.length, newLines.length);

                                            for (let i = 0; i < maxLen; i++) {
                                                const oldLine = oldLines[i]?.trim() || '';
                                                const newLine = newLines[i]?.trim() || '';

                                                if (oldLine !== newLine) {
                                                    if (oldLine && !newLines.includes(oldLine)) {
                                                        changes.push(
                                                            <div key={`old-${i}`} className="bg-red-100 border-l-4 border-red-500 p-2 my-1">
                                                                <span className="text-red-700">- {oldLine}</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (newLine && !oldLines.includes(newLine)) {
                                                        changes.push(
                                                            <div key={`new-${i}`} className="bg-green-100 border-l-4 border-green-500 p-2 my-1">
                                                                <span className="text-green-700">+ {newLine}</span>
                                                            </div>
                                                        );
                                                    }
                                                }
                                            }

                                            return changes.length > 0 ? changes : (
                                                <div className="text-gray-500 italic">Minor formatting changes only</div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div className="space-y-4">
                    {versions.map((version, index) => (
                        <div
                            key={version._id}
                            className={`border rounded p-4 cursor-pointer transition ${compareMode && selectedVersions.includes(version._id)
                                ? 'bg-blue-50 border-blue-400'
                                : 'hover:bg-gray-50'
                                }`}
                            onClick={() => compareMode && handleVersionSelect(version._id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold">
                                        {compareMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedVersions.includes(version._id)}
                                                onChange={() => handleVersionSelect(version._id)}
                                                className="mr-2"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                        Version {version.version_number}
                                        {index === 0 && (
                                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(version.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {index !== 0 && !compareMode && (
                                    <button
                                        onClick={() => handleRestore(version._id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        Restore
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-gray-700">
                                <strong>Title:</strong> {version.title}
                            </div>
                        </div>
                    ))}

                    {versions.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No version history available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
