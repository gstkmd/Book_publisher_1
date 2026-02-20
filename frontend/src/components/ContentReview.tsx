'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';

interface Comment {
    id?: string;
    _id?: string;
    text: string;
    selection_range?: { from: number; to: number };
    author: any;
    author_name?: string;
    resolved: boolean;
    created_at: string;
}

interface Content {
    id: string;
    _id: string;
    title: string;
    body: any;
    status: string;
    created_at: string;
    updated_at: string;
}

interface ContentReviewProps {
    contentId: string;
    showSidebar?: boolean;
    isEmbedded?: boolean;
    onCommentPosted?: () => void;
}

export default function ContentReview({
    contentId,
    showSidebar = true,
    isEmbedded = false,
    onCommentPosted
}: ContentReviewProps) {
    const { token, user } = useAuth();

    const [content, setContent] = useState<Content | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Inline Comment State
    const contentRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<{ from: number; to: number; rect: DOMRect } | null>(null);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        if (token && contentId) {
            fetchContent();
            fetchComments();
        }
    }, [token, contentId]);

    const fetchContent = async () => {
        try {
            const data = await api.get(`/generic/content/${contentId}`, token || undefined);
            setContent(data);
        } catch (error) {
            console.error('Error fetching content:', error);
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
        if (typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                return extractTextFromRichText(parsed);
            } catch {
                return body;
            }
        }
        if (body.text && typeof body.text === 'string') return body.text;
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

    const getGlobalOffset = (root: Node, targetNode: Node, targetOffset: number): number => {
        let offset = 0;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let currentNode = walker.nextNode();

        while (currentNode) {
            if (currentNode === targetNode) {
                return offset + targetOffset;
            }
            offset += currentNode.textContent?.length || 0;
            currentNode = walker.nextNode();
        }
        return -1;
    };

    const handleTextSelection = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            if (!showCommentInput) setSelection(null);
            return;
        }

        const range = sel.getRangeAt(0);
        if (!contentRef.current?.contains(range.commonAncestorContainer)) return;

        const start = getGlobalOffset(contentRef.current, range.startContainer, range.startOffset);
        const end = getGlobalOffset(contentRef.current, range.endContainer, range.endOffset);

        if (start !== -1 && end !== -1 && end > start) {
            const rect = range.getBoundingClientRect();
            setSelection({ from: start, to: end, rect });
        }
    };

    const handleInlineCommentSubmit = async () => {
        if (!newCommentText.trim() || !selection) return;
        setPostingComment(true);

        const payload = {
            content_id: contentId,
            text: newCommentText,
            selection_range: { from: selection.from, to: selection.to },
            author: user?.id,
            resolved: false
        };

        try {
            await api.post('/generic/comments', payload, token || undefined);
            setNewCommentText('');
            setShowCommentInput(false);
            setSelection(null);

            // Refetch AND optimistically refresh stats?
            await fetchComments();

            toast.success('Comment posted successfully!');

            window.getSelection()?.removeAllRanges();
            if (onCommentPosted) onCommentPosted();
        } catch (err: any) {
            console.error("Comment Post Error:", err);
            toast.error('Failed to post comment');
        } finally {
            setPostingComment(false);
        }
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
                    commentId: comment.id || comment._id!,
                    resolved: comment.resolved
                });
            }
        });

        highlights.sort((a, b) => a.from - b.from);

        let result: any[] = [];
        let lastIndex = 0;

        highlights.forEach((highlight, idx) => {
            if (highlight.from > lastIndex) {
                result.push(<span key={`text-${idx}`}>{text.substring(lastIndex, highlight.from)}</span>);
            }

            result.push(
                <mark
                    key={`highlight-${idx}`}
                    id={`highlight-${highlight.commentId}`}
                    className={`cursor-pointer transition-colors duration-200 ${highlight.resolved ? 'bg-green-200 opacity-50' : 'bg-yellow-300'
                        } ${selectedCommentId === highlight.commentId ? 'ring-2 ring-blue-500 bg-yellow-400' : ''}`}
                    onClick={() => {
                        setSelectedCommentId(highlight.commentId);
                        document.getElementById(`comment-${highlight.commentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    onMouseEnter={() => setSelectedCommentId(highlight.commentId)}
                    title="Click to view comment"
                >
                    {text.substring(highlight.from, highlight.to)}
                </mark>
            );

            lastIndex = highlight.to;
        });

        if (lastIndex < text.length) {
            result.push(<span key="text-final">{text.substring(lastIndex)}</span>);
        }

        return result;
    };

    const sortedComments = [...comments].sort((a, b) => {
        const fromA = a.selection_range?.from || Infinity;
        const fromB = b.selection_range?.from || Infinity;
        return fromA - fromB;
    });

    const filteredComments = sortedComments.filter(c => {
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

    if (loading) return <div className="text-center py-12 text-gray-500">Loading content...</div>;
    if (!content) return <div className="text-center py-12 text-red-500">Content not found</div>;

    return (
        <div className={`grid ${showSidebar ? (isEmbedded ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-3') : 'grid-cols-1'} gap-4 md:gap-6`}>
            {/* Main Content Area */}
            <div className={`${showSidebar ? (isEmbedded ? 'lg:col-span-2' : 'col-span-2') : 'col-span-1'} bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-8`}>
                {!isEmbedded && <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{content.title}</h1>}
                <div className="text-sm text-gray-400 mb-6 flex items-center justify-between">
                    <span>Last updated: {new Date(content.updated_at).toLocaleString()}</span>
                    {isEmbedded && <Link href={`/dashboard/library/${contentId}/review`} className="text-blue-600 hover:underline">Open Full View</Link>}
                </div>
                <div
                    ref={contentRef}
                    className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap relative min-h-[200px]"
                    onMouseUp={handleTextSelection}
                >
                    {renderContentWithHighlights()}
                </div>

                {/* Floating Comment Button / Input */}
                {selection && (
                    <div
                        style={{
                            position: 'fixed',
                            top: selection.rect.top - (showCommentInput ? 120 : 40),
                            left: selection.rect.left + (selection.rect.width / 2) - 20,
                            zIndex: 50
                        }}
                        className="transform -translate-x-1/2"
                    >
                        {!showCommentInput ? (
                            <button
                                onClick={() => setShowCommentInput(true)}
                                className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-110"
                                title="Add Comment"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ) : (
                            <div className="bg-white p-3 rounded-lg shadow-xl border w-64 animate-fade-in-up">
                                <textarea
                                    autoFocus
                                    className="w-full text-sm border rounded p-2 mb-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                    rows={2}
                                    placeholder="Comment on this text..."
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => { setShowCommentInput(false); setSelection(null); }}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInlineCommentSubmit}
                                        disabled={postingComment}
                                        className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {postingComment ? '...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Comments Sidebar */}
            {showSidebar && (
                <div className="bg-white rounded-lg shadow-sm h-fit sticky top-20 md:top-24 border border-gray-100">
                    <div className="p-3 md:p-4 border-b">
                        <h2 className="font-bold text-base md:text-lg">Comments</h2>
                        <div className="flex gap-2 mt-3 text-[10px] font-bold uppercase tracking-wider overflow-x-auto pb-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-2 py-1 rounded ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                All ({stats.total})
                            </button>
                            <button
                                onClick={() => setFilter('unresolved')}
                                className={`px-2 py-1 rounded ${filter === 'unresolved'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                Unresolved ({stats.unresolved})
                            </button>
                            <button
                                onClick={() => setFilter('resolved')}
                                className={`px-2 py-1 rounded ${filter === 'resolved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                Resolved ({stats.resolved})
                            </button>
                        </div>
                    </div>

                    <div className="p-4 max-h-[calc(100vh-350px)] overflow-y-auto space-y-4">
                        {filteredComments.length === 0 && (
                            <p className="text-gray-400 italic text-sm text-center py-8">
                                No {filter !== 'all' ? filter : ''} comments
                            </p>
                        )}
                        {filteredComments.map((comment) => (
                            <div
                                key={comment.id || comment._id}
                                id={`comment-${comment.id || comment._id}`}
                                onClick={() => {
                                    setSelectedCommentId(comment.id || comment._id!);
                                    const el = document.getElementById(`highlight-${comment.id || comment._id}`);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                                onMouseEnter={() => setSelectedCommentId(comment.id || comment._id!)}
                                className={`border rounded p-3 cursor-pointer transition-all duration-200 ${selectedCommentId === (comment.id || comment._id)
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400 shadow-sm'
                                    : 'border-gray-100 hover:border-blue-200'
                                    } ${comment.resolved ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                            {new Date(comment.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 mt-1">
                                        <UserAvatar name={comment.author_name || 'Unknown'} size="xs" />
                                        <span className="text-xs font-bold text-gray-700">{comment.author_name || 'Unknown'}</span>
                                        <div className="flex-1"></div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleResolve((comment.id || comment._id)!, comment.resolved);
                                            }}
                                            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${comment.resolved
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {comment.resolved ? '✓ Resolved' : 'Resolve'}
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-sm text-gray-700 leading-snug ${comment.resolved ? 'line-through' : ''}`}>
                                    {comment.text}
                                </p>
                                {comment.selection_range && (
                                    <div className="mt-2 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                                        Linked to text
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
