'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShareContentModal from '@/components/ShareContentModal';
import ModuleGuard from '@/components/ModuleGuard';

export default function ContentLibrary() {
    const { token, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [contents, setContents] = useState<any[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<any>(null);
    const [orgSettings, setOrgSettings] = useState<any>(null);

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const statusParam = searchParams?.get('status');

    useEffect(() => {
        if (statusParam) {
            setActiveFilters(prev => ({ ...prev, status: [statusParam] }));
        }
    }, [statusParam]);

    useEffect(() => {
        if (token) {
            fetchContent();
            fetchOrgSettings();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [token, authLoading]);

    const fetchOrgSettings = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrgSettings(data.content_settings || {
                labels: { title: 'Title', body: 'Content' },
                customFields: []
            });
        } catch (err) {
            console.error('Failed to fetch org settings:', err);
        }
    };

    const fetchContent = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get('/generic/content', token!);
            setContents(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch content:', err);
            setError(err.message || 'Failed to load content');
            setContents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (category: string, value: string) => {
        setActiveFilters(prev => {
            const current = prev[category] || [];
            if (current.includes(value)) {
                const updated = current.filter(v => v !== value);
                const next = { ...prev };
                if (updated.length === 0) {
                    delete next[category];
                } else {
                    next[category] = updated;
                }
                return next;
            } else {
                return { ...prev, [category]: [...current, value] };
            }
        });
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearchQuery('');
    };

    const normalizeValue = (category: string, value: any) => {
        if (!value) return '';
        const valStr = String(value);
        if (category.toLowerCase().includes('chapter')) {
            // Remove "chapter" or "chap" prefix case-insensitively
            return valStr.replace(/^(chapter|chap)\s*/i, '').trim();
        }
        return valStr;
    };

    const getFilterOptions = (category: string) => {
        const options = new Set<string>();
        contents.forEach(c => {
            if (category === 'status') {
                if (c.status) options.add(c.status);
            } else if (category === 'type') {
                if (c.type) options.add(c.type);
            } else {
                // Custom field
                const val = normalizeValue(category, c.custom_fields?.[category]);
                if (val) options.add(val);
            }
        });
        return Array.from(options).sort((a, b) => {
            const na = parseInt(a);
            const nb = parseInt(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });
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

    const handleExport = (contentId: string, format: 'docx' | 'epub' = 'docx') => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
        console.log('Content shared successfully');
    };

    const handleMigrate = async () => {
        if (!confirm('This will assign all orphaned content to your organization. Continue?')) return;
        try {
            setLoading(true);
            const res = await api.post('/generic/migrate-orphans', {}, token!);
            alert(res.message || 'Migration successful');
            fetchContent();
        } catch (err: any) {
            console.error(err);
            alert('Migration failed: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleNormalize = async () => {
        if (!confirm('This will standardize all content types and chapter numbers to match organization settings. Continue?')) return;
        try {
            setLoading(true);
            const res = await api.post('/generic/normalize-data', {}, token!);
            alert(res.message || 'Normalization successful');
            fetchContent();
        } catch (err: any) {
            console.error(err);
            alert('Normalization failed: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const filteredContent = contents.filter(c => {
        if (!c) return false;

        // Advanced Filters
        for (const [category, selectedValues] of Object.entries(activeFilters)) {
            if (selectedValues.length === 0) continue;

            let itemValue = '';
            if (category === 'status') itemValue = c.status;
            else if (category === 'type') itemValue = c.type;
            else itemValue = normalizeValue(category, c.custom_fields?.[category]);

            if (!selectedValues.includes(itemValue)) return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = c.title?.toLowerCase().includes(query);
            const matchesCustomFields = Object.values(c.custom_fields || {}).some(
                val => String(val).toLowerCase().includes(query)
            );
            return matchesTitle || matchesCustomFields;
        }

        return true;
    });

    const getStatusBadge = (status?: string) => {
        const st = status || 'draft';
        const colors: Record<string, string> = {
            draft: 'bg-yellow-100 text-yellow-800',
            review: 'bg-teal-100 text-teal-800 border border-teal-200',
            approved: 'bg-green-100 text-green-800',
            published: 'bg-indigo-100 text-indigo-800',
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

    const activeFilterCount = Object.values(activeFilters).flat().length;

    return (
        <ModuleGuard moduleName="library">
            <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Content Library</h1>
                <Link href="/dashboard/editor/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    + New Content
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col mb-6 bg-white p-4 rounded-lg shadow-sm border gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <input
                                type="text"
                                placeholder={`Search ${orgSettings?.labels?.title || 'Title'} or custom fields...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${showFilterPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">View:</span>
                            <div className="flex border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setView('grid')}
                                    className={`px-3 py-1.5 text-xs font-medium ${view === 'grid' ? 'bg-gray-100 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >Grid</button>
                                <button
                                    onClick={() => setView('list')}
                                    className={`px-3 py-1.5 text-xs font-medium border-l ${view === 'list' ? 'bg-gray-100 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >List</button>
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleNormalize}
                                    className="px-3 py-2 rounded-lg transition text-purple-600 hover:bg-purple-50 border border-purple-200 text-xs font-semibold"
                                    title="Standardize chapters and types to match org settings"
                                >
                                    ✨ Fix Standards
                                </button>
                                <button
                                    onClick={handleMigrate}
                                    className="px-3 py-2 rounded-lg transition text-amber-600 hover:bg-amber-50 border border-amber-200 text-xs font-semibold"
                                    title="Assign orphaned content to your organization"
                                >
                                    🛡️ Fix Visibility
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                {showFilterPanel && (
                    <div className="pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* Standard Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {['draft', 'review', 'approved', 'published', 'archived'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleFilterChange('status', status)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border transition ${activeFilters.status?.includes(status) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Field Filters */}
                            {orgSettings?.customFields?.map((field: any) => {
                                const options = getFilterOptions(field.name);
                                if (options.length === 0) return null;
                                return (
                                    <div key={field.name} className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{field.label}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {options.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleFilterChange(field.name, opt)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${activeFilters[field.name]?.includes(opt) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg border-t">
                            <span className="text-xs text-gray-500 italic">
                                Showing {filteredContent.length} of {contents.length} items
                            </span>
                            <button
                                onClick={clearFilters}
                                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
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
            {view === 'grid' && filteredContent.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredContent.map((c) => (
                        <div key={c._id || Math.random()} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-4">
                                <Link
                                    href={`/dashboard/library/${c.id || c._id}`}
                                    className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2"
                                >
                                    {c.title || 'Untitled'}
                                </Link>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                                    {c.status || 'draft'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-6">
                                {orgSettings?.customFields?.slice(0, 3).map((field: any) => (
                                    <div key={field.name} className="flex justify-between text-xs">
                                        <span className="text-gray-600">{field.label}:</span>
                                        <span className="text-gray-700 font-medium truncate ml-2">
                                            {normalizeValue(field.name, c.custom_fields?.[field.name]) || '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={`/dashboard/library/${c.id || c._id}/versions`}
                                        className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded text-[11px] font-bold"
                                    >Versions</Link>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport(c.id || c._id)}
                                        className="text-gray-600 hover:text-gray-600 p-1"
                                        title="Export"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id || c._id)}
                                        className="text-gray-600 hover:text-red-500 p-1"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === 'list' && filteredContent.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b text-nowrap">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                                    {orgSettings?.labels?.title || 'Title'}
                                </th>
                                {orgSettings?.customFields?.map((field: any) => (
                                    <th key={field.name} className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                                        {field.label}
                                    </th>
                                ))}
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 text-nowrap">Last Updated</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContent.map((c) => (
                                <tr key={c._id || Math.random()} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/dashboard/library/${c.id || c._id}`}
                                            className="font-bold text-sm text-gray-900 hover:text-indigo-600 transition-colors"
                                        >
                                            {c.title || 'Untitled'}
                                        </Link>
                                    </td>
                                    {orgSettings?.customFields?.map((field: any) => (
                                        <td key={field.name} className="px-6 py-4 text-sm text-gray-600">
                                            {normalizeValue(field.name, c.custom_fields?.[field.name]) || '-'}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                                                {c.status || 'draft'}
                                            </span>
                                            {c.status === 'review' && c.pending_reviewers?.length > 0 && (
                                                <span className="text-[10px] text-gray-600 italic">
                                                    Pending with: {c.pending_reviewers.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-nowrap">
                                        {formatDate(c.updated_at || c.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/dashboard/library/${c.id || c._id}/versions`}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >Versions</Link>
                                            <button
                                                onClick={() => handleShareClick(c)}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >Share</button>
                                            <button
                                                onClick={() => handleExport(c.id || c._id, 'docx')}
                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                            >Export</button>
                                            <button
                                                onClick={() => handleDelete(c.id || c._id)}
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
                    contentId={selectedContent.id || selectedContent._id}
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
        </ModuleGuard>
    );
}
