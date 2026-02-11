'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Comment {
    _id: string;
    text: string;
    selection_range?: { from: number; to: number };
    author: any;
    resolved: boolean;
    created_at: string;
}

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

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Fetch existing content
    useEffect(() => {
        if (token && contentId) {
            fetchContent();
            fetchComments();
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

    const unresolvedCount = comments.filter(c => !c.resolved).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Main Editor Area */}
            <div className={`flex-1 transition-all ${showComments ? 'mr-96' : ''}`}>
                <div className="container mx-auto p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Edit Content</h1>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/dashboard/library/${contentId}/review`}
                                className="text-sm px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                            >
                                📖 Review Mode
                            </Link>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className="relative text-sm px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                                💬 Comments
                                {unresolvedCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                                        {unresolvedCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
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
            </div>

            {/* Comments Sidebar */}
            {showComments && (
                <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl border-l overflow-y-auto z-50">
                    <div className="p-4 border-b bg-purple-50 sticky top-0">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-lg">💬 Comments</h2>
                            <button
                                onClick={() => setShowComments(false)}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            {unresolvedCount} unresolved · {comments.length} total
                        </div>
                    </div>

                    {/* Add Comment */}
                    <div className="p-4 border-b bg-gray-50">
                        <textarea
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="mt-2 w-full bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                            Post Comment
                        </button>
                    </div>

                    {/* Comments List */}
                    <div className="p-4 space-y-3">
                        {comments.length === 0 && (
                            <p className="text-gray-400 italic text-sm text-center py-8">
                                No comments yet
                            </p>
                        )}
                        {comments.map((comment) => (
                            <div
                                key={comment._id}
                                className={`border rounded p-3 ${comment.resolved ? 'opacity-60 bg-green-50' : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="text-xs text-gray-600">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => toggleResolve(comment._id, comment.resolved)}
                                        className={`text-xs px-2 py-1 rounded ${comment.resolved
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {comment.resolved ? '✓ Resolved' : 'Resolve'}
                                    </button>
                                </div>
                                <p className={`text-sm ${comment.resolved ? 'line-through' : ''}`}>
                                    {comment.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
