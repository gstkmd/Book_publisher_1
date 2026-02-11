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

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

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
                body: { text: content }, // Simple text for now
                type,
                status: 'draft',
                author: user?.id,
                organization_id: user?.organization_id || null
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

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Create New Content</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 mb-4">
                    Content editor coming soon! This will allow you to create and edit educational content with a rich text editor.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter content title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-64"
                            placeholder="Start writing..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                </div>
            </div>
        </div>
    );
}
