'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { RichTextEditor } from '@/components/RichTextEditor';
import { SupportingDocuments } from '@/components/SupportingDocuments';
import toast from 'react-hot-toast';

function EditorNewContent() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('taskId');
    const fromTask = searchParams.get('fromTask') === 'true';

    const [title, setTitle] = useState('');
    const [type, setType] = useState('article');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [orgSettings, setOrgSettings] = useState<any>(null);
    const [customValues, setCustomValues] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token && user?.organization_id) {
            fetchOrgSettings();
        }
    }, [token, user]);

    const fetchOrgSettings = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            if (data?.content_settings) {
                setOrgSettings(data.content_settings);
                // Set default type to the first option if available
                if (data.content_settings.contentTypeOptions) {
                    const options = data.content_settings.contentTypeOptions.split(',').map((t: string) => t.trim().toLowerCase());
                    if (options.length > 0 && options[0]) {
                        setType(options[0]);
                    }
                }
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

    const handleSave = async (status: 'draft' | 'published' = 'draft') => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            await api.post('/generic/content', {
                title,
                slug,
                body: { text: content },
                type,
                status: status,
                author: user?.id,
                organization_id: user?.organization_id || null,
                custom_fields: customValues,
                attachments: attachments
            }, token!);

            toast.success(status === 'published' ? 'Content published successfully!' : 'Draft saved successfully!');
            
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
            let msg = 'Unknown error occurred on the server.';
            try { msg = JSON.parse(err.message).detail || msg; } catch { msg = err.message || msg; }
            toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'}: ` + msg);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    const labels = orgSettings?.labels || { title: 'Title', body: 'Content' };
    const customFields = orgSettings?.customFields || [];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Sticky Header Actions */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Create New Content</h1>
                        <div className="h-6 w-[1px] bg-slate-200" />
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                General Info
                            </button>
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Manuscript Content
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSave('draft')}
                            disabled={saving}
                            className="bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={() => handleSave('published')}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            {saving ? 'Publishing...' : 'Publish Now'}
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
                            className="bg-rose-100 text-rose-600 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all active:scale-95 shadow-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-[98%]">
                <div className="space-y-8">
                    {activeTab === 'info' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2rem] shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        {labels.title} *
                                    </label>
                                    <input
                                        type="text"
                                        list="title-options"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-900 placeholder:text-slate-300 transition-all shadow-sm"
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
                                    <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        Classification
                                    </label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-900 transition-all appearance-none cursor-pointer shadow-sm"
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
                                        <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            {field.label}
                                        </label>
                                        <input
                                            type="text"
                                            list={`options-${field.name}`}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-900 placeholder:text-slate-300 transition-all shadow-sm"
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
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-t-4 border-t-violet-500 border-x border-b border-slate-100">
                                <SupportingDocuments
                                    attachments={attachments}
                                    onChange={setAttachments}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'content' && (
                        /* Content Editor Area */
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border-t-4 border-t-indigo-600 border-x border-b border-slate-100 min-h-[75vh] flex flex-col">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-indigo-50/30 rounded-t-[2.3rem]">
                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    {labels.body}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-400 mr-4 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">Live Edit Enabled</span>
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
    );
}

export default function EditorNewPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading editor...</div>}>
            <EditorNewContent />
        </Suspense>
    );
}
