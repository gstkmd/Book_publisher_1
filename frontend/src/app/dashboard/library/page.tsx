'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContentLibrary() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [contents, setContents] = useState<any[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [filter, setFilter] = useState('all');
    const [showMenu, setShowMenu] = useState<string | null>(null);

    useEffect(() => {
        if (token) fetchContent();
    }, [token]);

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
            const data = await api.get('/generic/content', token!);
            setContents(data);
        } catch (err) { console.error(err); }
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
            fetchContent(); // Refresh list
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
            fetchContent(); // Refresh list
        } catch (err: any) {
            console.error(err);
            alert('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    };

    const handleExport = async (contentId: string, format: 'pdf' | 'docx' = 'pdf') => {
        try {
            window.open(`${process.env.NEXT_PUBLIC_API_URL}/generic/export_content/${contentId}?format=${format}`, '_blank');
        } catch (err: any) {
            console.error(err);
            alert('Failed to export: ' + (err.message || 'Unknown error'));
        }
    };

    const filteredContent = contents.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter;
    });

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || colors.draft;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            article: 'Article',
            book_chapter: 'Chapter',
            lesson: 'Lesson',
            resource: 'Activity'
        };
        return labels[type] || type;
    };

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

            {/* Grid View */}
            {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredContent.map(c => (
                        <div key={c._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition">
                            <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center text-gray-400">
                                {c.cover_image ? <img src={c.cover_image} className="h-full w-full object-cover rounded-t-lg" alt={c.title} /> : '📄'}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-lg truncate flex-1">{c.title}</h3>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(showMenu === c._id ? null : c._id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                        >⋮</button>
                                        {showMenu === c._id && (
                                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10" onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/dashboard/editor/${c._id}`} className="block px-4 py-2 hover:bg-gray-50 text-sm">✏️ Edit</Link>
                                                {c.status === 'draft' && (
                                                    <button onClick={() => handlePublish(c._id)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">📤 Publish</button>
                                                )}
                                                <Link href={`/dashboard/library/${c._id}/versions`} className="block px-4 py-2 hover:bg-gray-50 text-sm">🕐 Versions</Link>
                                                <button onClick={() => handleExport(c._id, 'pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">📥 Export PDF</button>
                                                <button onClick={() => handleExport(c._id, 'docx')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">📥 Export Word</button>
                                                <button onClick={() => handleDelete(c._id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600">🗑️ Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(c.status || 'draft')}`}>
                                        {c.status || 'draft'}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        {getTypeLabel(c.type)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>📅 {new Date(c.created_at).toLocaleDateString()}</div>
                                    <div className="truncate">👤 {c.author || 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Title</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Type</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Author</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Last Updated</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContent.map(c => (
                                <tr key={c._id} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{c.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{getTypeLabel(c.type)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(c.status || 'draft')}`}>
                                            {c.status || 'draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.author || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/editor/${c._id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >Edit</Link>
                                            {c.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublish(c._id)}
                                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                >Publish</button>
                                            )}
                                            <Link
                                                href={`/dashboard/library/${c._id}/versions`}
                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                            >Versions</Link>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMenu(showMenu === c._id ? null : c._id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 px-2"
                                                >&#x22ee;</button>
                                                {showMenu === c._id && (
                                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => handleExport(c._id, 'pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">📥 Export PDF</button>
                                                        <button onClick={() => handleExport(c._id, 'docx')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">📥 Export Word</button>
                                                        <button onClick={() => handleDelete(c._id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600">🗑️ Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
