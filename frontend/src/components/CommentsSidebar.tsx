'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Comment {
    id?: string;
    _id?: string;
    text: string;
    author: any; // In real app, User type
    created_at: string;
    resolved: boolean;
}

interface CommentsSidebarProps {
    documentId: string;
    wsMessages: string[];
}

export const CommentsSidebar: React.FC<CommentsSidebarProps> = ({ documentId, wsMessages }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchComments();
    }, [documentId, token]);

    // Listen for WS updates
    useEffect(() => {
        const lastMsg = wsMessages[wsMessages.length - 1];
        if (lastMsg && lastMsg.startsWith('New Comment:')) {
            // Optimistic update or refetch
            fetchComments();
        }
    }, [wsMessages]);

    const fetchComments = async () => {
        if (!token) return;
        try {
            const data = await api.get(`/generic/content/${documentId}/comments`, token);
            console.log('Fetched Comments:', data);
            if (Array.isArray(data)) {
                setComments(data);
            } else {
                console.error('Comments data is not an array:', data);
                setComments([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await api.post('/generic/comments', {
                content_id: documentId,
                text: newComment,
                // selection_range: ... (Future: grab from editor)
            }, token || undefined);
            setNewComment('');
            fetchComments();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-80 border-l bg-gray-50 flex flex-col h-full bg-white shadow-lg">
            <div className="p-4 border-b font-bold text-lg bg-gray-100">Comments</div>

            {/* Debug UI - Remove after fixing */}
            <div className="p-2 bg-yellow-100 text-xs text-black overflow-auto max-h-32">
                <strong>Debug Info:</strong>
                <pre>{JSON.stringify({ count: comments.length, data: comments }, null, 2)}</pre>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 && <p className="text-gray-400 italic text-sm">No comments yet.</p>}
                {comments.map((c) => (
                    <div key={c.id || c._id} className="bg-white p-3 rounded shadow-sm border text-sm">
                        <p className="mb-2">{c.text}</p>
                        <div className="text-xs text-gray-400 flex justify-between">
                            <span>{new Date(c.created_at).toLocaleString()}</span>
                            {/* <span>{c.author?.email}</span> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
                <textarea
                    className="w-full border rounded p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                    onClick={handleAddComment}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </div>
    );
};
