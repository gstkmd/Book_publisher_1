'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RichTextEditor } from '@/components/RichTextEditor';
import Link from 'next/link';

interface Comment {
    id?: string;
    _id?: string;
    text: string;
    selection_range?: { from: number; to: number };
    author: any;
    resolved: boolean;
    created_at: string;
}

import { ReviewDisplay } from '@/components/ReviewDisplay';

export default function EditorEditPage() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const contentId = params.id as string;

    const [title, setTitle] = useState('');
    const [type, setType] = useState('article');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [orgSettings, setOrgSettings] = useState<any>(null);
    const [customValues, setCustomValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Fetch existing content and org settings
    useEffect(() => {
        if (token && contentId) {
            fetchContent();
            fetchComments();
            fetchOrgSettings();
        }
    }, [token, contentId]);

    const fetchOrgSettings = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            if (data?.content_settings) {
                setOrgSettings(data.content_settings);
            }
        } catch (err) {
            console.error('Failed to fetch org settings:', err);
        }
    };

    // Auto-fill logic based on title mappings
    useEffect(() => {
        if (orgSettings?.mappings && title) {
            const mapping = orgSettings.mappings.find((m: any) => m.trigger === title);
            if (mapping) {
                if (mapping.fields.type) setType(mapping.fields.type);

                // Merge other fields into customValues
                const newValues = { ...customValues };
                Object.keys(mapping.fields).forEach(key => {
                    if (key !== 'type') {
                        newValues[key] = mapping.fields[key];
                    }
                });
                setCustomValues(newValues);
            }
        }
    }, [title, orgSettings]);

    const fetchContent = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}`, token!);
            setTitle(data.title || '');
            setType(data.type || 'article');
            setContent(data.body?.text || '');
            setAuthor(data.author || user?.id || '');
            setCustomValues(data.custom_fields || {});
        } catch (err: any) {
            console.error(err);
            alert('Failed to load content: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}/comments`, token || undefined);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post('/generic/comments', {
                content_id: contentId,
                text: newComment,
                author: user?.id,
                resolved: false
            }, token || undefined);
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    };

    const toggleResolve = async (commentId: string, currentResolved: boolean) => {
        try {
            await api.patch(`/generic/comments/${commentId}/resolve?resolved=${!currentResolved}`, {}, token || undefined);
            fetchComments();
        } catch (error) {
            console.error('Error toggling resolution:', error);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            await api.put(`/generic/content/${contentId}`, {
                title,
                slug,
                body: { text: content },
                type,
                status: 'draft',
                author: author || user?.id,
                organization_id: user?.organization_id || null,
                custom_fields: customValues
            }, token!);

            alert('Content updated successfully!');
            router.push('/dashboard/library');
        } catch (err: any) {
            console.error(err);
            alert('Failed to update content: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            await api.put(`/generic/content/${contentId}`, {
                title,
                slug,
                body: { text: content },
                type,
                status: 'published',
                author: author || user?.id,
                organization_id: user?.organization_id || null,
                custom_fields: customValues
            }, token!);

            alert('Content published successfully!');
            router.push('/dashboard/library');
        } catch (err: any) {
            console.error(err);
            alert('Failed to publish content: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    const unresolvedCount = comments.filter(c => !c.resolved).length;

    const labels = orgSettings?.labels || { title: 'Title', body: 'Content' };
    const customFields = orgSettings?.customFields || [];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Main Editor Area */}
            <div className={`flex-1 transition-all duration-300 overflow-y-auto ${showComments ? 'w-1/2' : 'w-full'}`}>
                <div className={`container mx-auto p-8 ${showComments ? 'max-w-none' : ''}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Edit Content</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={`text-sm px-4 py-2 text-white rounded transition-colors ${showComments ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {showComments ? 'Hide Comments' : 'Show Comments & Review'}
                                {unresolvedCount > 0 && (
                                    <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {unresolvedCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.title} *</label>
                                <input
                                    type="text"
                                    list="title-options"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Enter ${labels.title.toLowerCase()}...`}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                {orgSettings?.titleOptions && (
                                    <datalist id="title-options">
                                        {orgSettings.titleOptions.split(',').map((opt: string) => (
                                            <option key={opt.trim()} value={opt.trim()} />
                                        ))}
                                    </datalist>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        {orgSettings?.contentTypeOptions ? (
                                            orgSettings.contentTypeOptions.split(',').map((opt: string) => (
                                                <option key={opt.trim()} value={opt.trim().toLowerCase()}>
                                                    {opt.trim()}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="article">Article</option>
                                                <option value="book_chapter">Textbook Chapter</option>
                                                <option value="lesson">Lesson</option>
                                                <option value="resource">Activity</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                {/* Custom Fields */}
                                {customFields.map((field: any) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                        <input
                                            type="text"
                                            list={`options-${field.name}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                                            value={customValues[field.name] || ''}
                                            onChange={(e) => setCustomValues({ ...customValues, [field.name]: e.target.value })}
                                        />
                                        {field.options && (
                                            <datalist id={`options-${field.name}`}>
                                                {field.options.split(',').map((opt: string) => (
                                                    <option key={opt.trim()} value={opt.trim()} />
                                                ))}
                                            </datalist>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.body}</label>
                                <RichTextEditor
                                    content={content}
                                    onChange={(html) => setContent(html)}
                                    placeholder="Start writing..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {saving ? 'Saving...' : 'Save Draft'}
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={saving}
                                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {saving ? 'Publishing...' : 'Publish'}
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/library')}
                                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review / Comments Split Panel */}
            {showComments && (
                <div className="w-1/2 h-full border-l shadow-2xl z-40 bg-white">
                    <ReviewDisplay contentId={contentId} onClose={() => setShowComments(false)} />
                </div>
            )}
        </div>
    );
}
