'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EditorNewPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

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
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option>Textbook Chapter</option>
                            <option>Article</option>
                            <option>Lesson</option>
                            <option>Activity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-64"
                            placeholder="Start writing..."
                        />
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Save Draft
                    </button>
                </div>
            </div>
        </div>
    );
}
