'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { RichTextEditor } from '@/components/RichTextEditor';
import { SupportingDocuments } from '@/components/SupportingDocuments';
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

function EditorEditContent() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const contentId = params.id as string;
    const taskId = searchParams.get('taskId');
    const fromTask = searchParams.get('fromTask') === 'true';

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
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'content'>('content');

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
            setAttachments(data.attachments || []);
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
                custom_fields: customValues,
                attachments: attachments
            }, token!);

            alert('Content updated successfully!');
            
            // If we have a taskId or fromTask flag, it means we likely opened this in a new tab from TaskDetail
            // We should just close this tab to go back to the task creation window
            if (taskId || fromTask) {
                if (window.opener || window.history.length === 1) {
                    window.close();
                } else {
                    router.push(taskId ? `/dashboard/tasks/${taskId}` : '/dashboard/tasks');
                }
            } else {
                router.push('/dashboard/library');
            }
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
                custom_fields: customValues,
                attachments: attachments
            }, token!);

            alert('Content published successfully!');
            if (taskId || fromTask) {
                if (window.opener || window.history.length === 1) {
                    window.close();
                } else {
                    router.push(taskId ? `/dashboard/tasks/${taskId}` : '/dashboard/tasks');
                }
            } else {
                router.push('/dashboard/library');
            }
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
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Sticky Header Actions */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Manuscript Editor</h1>
                        <div className="h-6 w-[1px] bg-slate-200" />
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                General Info
                            </button>
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Manuscript Content
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${showComments ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {showComments ? 'Hide Review Panel' : 'Review & Comments'}
                            {unresolvedCount > 0 && (
                                <span className="ml-2 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    {unresolvedCount}
                                </span>
                            )}
                        </button>
                        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-white text-slate-900 border border-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={saving}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all shadow-lg active:scale-95"
                        >
                            {saving ? 'Publishing...' : 'Publish'}
                        </button>
                        <button
                            onClick={() => {
                                if (taskId || fromTask) {
                                    if (window.opener || window.history.length === 1) {
                                        window.close();
                                    } else {
                                        router.push(taskId ? `/dashboard/tasks/${taskId}` : '/dashboard/tasks');
                                    }
                                } else {
                                    router.push('/dashboard/library');
                                }
                            }}
                            className="bg-rose-50 text-rose-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Editor Area */}
                <div className={`flex-1 overflow-y-auto transition-all duration-500 ${showComments ? 'w-1/2' : 'w-full'}`}>
                    <div className="container mx-auto px-4 py-8 max-w-[98%]">
                        <div className="space-y-8">
                            {activeTab === 'info' && (
                                <>
                                    {/* Meta Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{labels.title} *</label>
                                            <input
                                                type="text"
                                                list="title-options"
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 placeholder:text-slate-300 transition-all"
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

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                                            <select
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 transition-all appearance-none cursor-pointer"
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
                                            <div key={field.name} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                                <input
                                                    type="text"
                                                    list={`options-${field.name}`}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 placeholder:text-slate-300 transition-all"
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

                                    {/* Attachments Section */}
                                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                        <SupportingDocuments
                                            attachments={attachments}
                                            onChange={setAttachments}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'content' && (
                                /* Content Editor Area */
                                <div className="bg-white p-2 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[75vh] flex flex-col">
                                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{labels.body}</span>
                                        <span className="text-[10px] font-bold text-slate-300 mr-4">Live Edit Enabled</span>
                                    </div>
                                    <div className="flex-1">
                                        <RichTextEditor
                                            content={content}
                                            onChange={(html) => setContent(html)}
                                            placeholder="Start crafting your manuscript..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Review / Comments Split Panel */}
                {showComments && (
                    <div className="w-1/2 h-full border-l border-slate-200 bg-white animate-in slide-in-from-right duration-500">
                        <ReviewDisplay contentId={contentId} onClose={() => setShowComments(false)} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EditorEditPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading editor...</div>}>
            <EditorEditContent />
        </Suspense>
    );
}
