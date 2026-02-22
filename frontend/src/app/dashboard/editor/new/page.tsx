'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function EditorNewPage() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [type, setType] = useState('article');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [orgSettings, setOrgSettings] = useState<any>(null);
    const [customValues, setCustomValues] = useState<Record<string, string>>({});

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
            }
        } catch (err) {
            console.error('Failed to fetch org settings:', err);
        }
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            alert('Please enter a title');
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
                status: 'draft',
                author: user?.id,
                organization_id: user?.organization_id || null,
                custom_fields: customValues
            }, token!);

            alert('Draft saved successfully!');
            router.push('/dashboard/library');
        } catch (err: any) {
            console.error(err);
            alert('Failed to save draft: ' + (err.message || 'Unknown error'));
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
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Create New Content</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.title}</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={`Enter ${labels.title.toLowerCase()}...`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="article">Article</option>
                                <option value="book_chapter">Textbook Chapter</option>
                                <option value="lesson">Lesson</option>
                                <option value="resource">Activity</option>
                            </select>
                        </div>
                        {/* Custom Fields */}
                        {customFields.map((field: any) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type="text"
                                    list={`options-${field.name}`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-64"
                            placeholder="Start writing..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => router.push('/dashboard/library')}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
