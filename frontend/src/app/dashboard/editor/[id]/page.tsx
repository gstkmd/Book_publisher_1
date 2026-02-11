'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Fetch existing content
    useEffect(() => {
        if (token && contentId) {
            fetchContent();
        }
    }, [token, contentId]);

    const fetchContent = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}`, token!);
            setTitle(data.title || '');
            setType(data.type || 'article');
            setContent(data.body?.text || '');
            setAuthor(data.author || user?.id || '');
        } catch (err: any) {
            console.error(err);
            alert('Failed to load content: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
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
                organization_id: user?.organization_id || null
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
                organization_id: user?.organization_id || null
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

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Edit Content</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter content title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="article">Article</option>
                            <option value="book_chapter">Textbook Chapter</option>
                            <option value="lesson">Lesson</option>
                            <option value="resource">Activity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Start writing..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
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
    );
}
