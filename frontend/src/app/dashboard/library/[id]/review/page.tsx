'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
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

interface Content {
    _id: string;
    title: string;
    body: any;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function ReviewContentPage() {
    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [content, setContent] = useState<Content | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && id) {
            fetchContent();
            fetchComments();
        }
    }, [token, id]);

    const fetchContent = async () => {
        try {
            const data = await api.get(`/generic/content/${id}`, token || undefined);
            setContent(data);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await api.get(`/generic/content/${id}/comments`, token || undefined);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const toggleResolve = async (commentId: string, currentResolved: boolean) => {
        try {
            await api.patch(`/generic/comments/${commentId}/resolve?resolved=${!currentResolved}`, {}, token || undefined);
            fetchComments(); // Refresh
        } catch (error) {
            console.error('Error toggling resolution:', error);
        }
    };

    const extractTextFromRichText = (body: any): string => {
        if (!body) return '';
        if (typeof body === 'string') return body;
        if (body.content && Array.isArray(body.content)) {
            return body.content.map((node: any) => {
                if (node.type === 'text') return node.text || '';
                if (node.content) return extractTextFromRichText(node);
                if (node.text) return node.text;
                return '';
            }).join('');
        }
        return JSON.stringify(body);
    };

    const renderContentWithHighlights = () => {
        if (!content) return null;

        const text = extractTextFromRichText(content.body);
        const highlights: Array<{ from: number; to: number; commentId: string; resolved: boolean }> = [];

        comments.forEach(comment => {
            if (comment.selection_range) {
                highlights.push({
                    from: comment.selection_range.from,
                    to: comment.selection_range.to,
                    commentId: comment._id,
                    resolved: comment.resolved
                });
            }
        });

        // Sort by position
        highlights.sort((a, b) => a.from - b.from);

        let result: any[] = [];
        let lastIndex = 0;

        highlights.forEach((highlight, idx) => {
            // Add text before highlight
            if (highlight.from > lastIndex) {
                result.push(<span key={`text-${idx}`}>{text.substring(lastIndex, highlight.from)}</span>);
            }

            // Add highlighted text
            result.push(
                <mark
                    key={`highlight-${idx}`}
                    className={`cursor-pointer ${highlight.resolved
                        ? 'bg-green-200 opacity-50'
                        : 'bg-yellow-300'
                        } ${selectedCommentId === highlight.commentId ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                        setSelectedCommentId(highlight.commentId);
                        document.getElementById(`comment-${highlight.commentId}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="Click to view comment"
                >
                    {text.substring(highlight.from, highlight.to)}
                </mark>
            );

            lastIndex = highlight.to;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            result.push(<span key="text-final">{text.substring(lastIndex)}</span>);
        }

        return result;
    };

    const filteredComments = comments.filter(c => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return c.resolved;
        if (filter === 'unresolved') return !c.resolved;
        return true;
    });

    const stats = {
        total: comments.length,
        unresolved: comments.filter(c => !c.resolved).length,
        resolved: comments.filter(c => c.resolved).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">Content not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/library" className="text-blue-600 hover:text-blue-800">
                            ← Back to Library
                        </Link>
                        <span className="text-gray-300">|</span>
                        <h1 className="text-lg font-semibold text-gray-800">Review Mode</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Read-Only</span>
                        <Link
                            href={`/dashboard/editor/${id}`}
                            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Edit Content
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="col-span-2 bg-white rounded-lg shadow p-8">
                        <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
                        <div className="text-sm text-gray-500 mb-6">
                            Last updated: {new Date(content.updated_at).toLocaleString()}
                        </div>
                        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {renderContentWithHighlights()}
                        </div>
                    </div>

                    {/* Comments Sidebar */}
                    <div className="bg-white rounded-lg shadow h-fit sticky top-20">
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-lg">Comments</h2>
                            <div className="flex gap-2 mt-3 text-xs">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1 rounded ${filter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    All ({stats.total})
                                </button>
                                <button
                                    onClick={() => setFilter('unresolved')}
                                    className={`px-3 py-1 rounded ${filter === 'unresolved'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    Unresolved ({stats.unresolved})
                                </button>
                                <button
                                    onClick={() => setFilter('resolved')}
                                    className={`px-3 py-1 rounded ${filter === 'resolved'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    Resolved ({stats.resolved})
                                </button>
                            </div>
                        </div>

                        <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto space-y-4">
                            {filteredComments.length === 0 && (
                                <p className="text-gray-400 italic text-sm text-center py-8">
                                    No {filter !== 'all' ? filter : ''} comments
                                </p>
                            )}
                            {filteredComments.map((comment) => (
                                <div
                                    key={comment._id}
                                    id={`comment-${comment._id}`}
                                    className={`border rounded p-3 ${selectedCommentId === comment._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                        } ${comment.resolved ? 'opacity-60' : ''}`}
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
                                            {comment.resolved ? '✓ Resolved' : 'Mark Resolved'}
                                        </button>
                                    </div>
                                    <p className={`text-sm ${comment.resolved ? 'line-through' : ''}`}>
                                        {comment.text}
                                    </p>
                                    {comment.selection_range && (
                                        <div className="mt-2 text-xs text-blue-600">
                                            📍 Linked to highlighted text
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
