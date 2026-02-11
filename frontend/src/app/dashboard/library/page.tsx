'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShareContentModal from '@/components/ShareContentModal';

export default function ContentLibrary() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [contents, setContents] = useState<any[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [filter, setFilter] = useState('all');
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<any>(null);

    useEffect(() => {
        if (token) {
            fetchContent();
        } else if (!authLoading) {
            // Auth loaded but no token - redirect to login
            setLoading(false);
        }
    }, [token, authLoading]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(null);
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showMenu]);

    const fetchContent = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching content with token:', token ? 'present' : 'missing');
            const data = await api.get('/generic/content', token!);
            console.log('Received data:', data);
            console.log('Is array:', Array.isArray(data));
            console.log('Data length:', Array.isArray(data) ? data.length : 'not an array');
            setContents(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch content:', err);
            setError(err.message || 'Failed to load content');
            setContents([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (contentId: string) => {
        if (!confirm('Are you sure you want to publish this content?')) return;

        try {
            const content = contents.find(c => c._id === contentId);
            if (!content) {
                alert('Content not found');
                return;
            }
            await api.put(`/generic/content/${contentId}`, {
                ...content,
                status: 'published'
            }, token!);

            alert('Content published successfully!');
            fetchContent();
        } catch (err: any) {
            console.error(err);
            alert('Failed to publish: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (contentId: string) => {
        if (!confirm('Are you sure you want to delete this content? This cannot be undone.')) return;

        try {
            await api.delete(`/generic/content/${contentId}`, token!);
            alert('Content deleted successfully!');
            fetchContent();
        } catch (err: any) {
            console.error(err);
            alert('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    };

    const handleExport = (contentId: string, format: 'pdf' | 'docx' = 'pdf') => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            // Updated to match corrected backend endpoint
            window.open(`${apiUrl}/generic/export_content/${contentId}?format=${format}`, '_blank');
        } catch (err: any) {
            console.error(err);
            alert('Failed to export: ' + (err.message || 'Unknown error'));
        }
    };

    const handleShareClick = (content: any) => {
        setSelectedContent(content);
        setShareModalOpen(true);
    };

    const handleShareSuccess = () => {
        // Optionally refresh content or show notification
        console.log('Content shared successfully');
    };

    const filteredContent = contents.filter(c => {
        if (!c) return false;
        if (filter === 'all') return true;
        return c.status === filter;
    });

    const getStatusBadge = (status?: string) => {
        const st = status || 'draft';
        const colors: Record<string, string> = {
            draft: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800'
        };
        return colors[st] || colors.draft;
    };

    const getTypeLabel = (type?: string) => {
        const labels: Record<string, string> = {
            article: 'Article',
            book_chapter: 'Chapter',
            lesson: 'Lesson',
            resource: 'Activity'
        };
        return labels[type || 'article'] || type || 'Article';
    };

    const formatDate = (dateStr?: string | Date) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-gray-500">Initializing...</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-gray-500">Loading content...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <h3 className="font-bold mb-2">Error Loading Content</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => fetchContent()}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Content Library</h1>
                <Link href="/dashboard/editor/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    + New Content
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between mb-6 bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >All</button>
                    <button
                        onClick={() => setFilter('draft')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'draft' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >Drafts</button>
                    <button
                        onClick={() => setFilter('published')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'published' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >Published</button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">View:</span>
                    <button
                        onClick={() => setView('grid')}
                        className={`px-3 py-1 rounded ${view === 'grid' ? 'bg-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >Grid</button>
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1 rounded ${view === 'list' ? 'bg-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >List</button>
                </div>
            </div>

            {filteredContent.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <p className="text-gray-500 text-lg">No content found</p>
                    <Link href="/dashboard/editor/new" className="text-blue-600 hover:underline mt-2 inline-block">
                        Create your first content
                    </Link>
                </div>
            )}

            {/* List View */}
            {view === 'list' && filteredContent.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Title</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Type</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Last Updated</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContent.map((c) => (
                                <tr key={c._id || Math.random()} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{c.title || 'Untitled'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{getTypeLabel(c.type)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(c.status)}`}>
                                            {c.status || 'draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDate(c.updated_at || c.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/dashboard/editor/${c._id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >Edit</Link>
                                            <Link
                                                href={`/dashboard/library/${c._id}/versions`}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >Versions</Link>
                                            <Link
                                                href={`/dashboard/library/${c._id}/review`}
                                                className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                                            >Review</Link>
                                            {c.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublish(c._id)}
                                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                >Publish</button>
                                            )}
                                            <button
                                                onClick={() => handleShareClick(c)}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >Share</button>
                                            <button
                                                onClick={() => handleExport(c._id, 'pdf')}
                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                            >Export</button>
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedContent && (
                <ShareContentModal
                    contentId={selectedContent._id}
                    contentTitle={selectedContent.title}
                    isOpen={shareModalOpen}
                    onClose={() => {
                        setShareModalOpen(false);
                        setSelectedContent(null);
                    }}
                    onSuccess={handleShareSuccess}
                />
            )}
        </div>
    );
}
