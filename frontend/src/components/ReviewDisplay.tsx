'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
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
    _id: string;
    title: string;
    body: any;
    status: string;
    created_at: string;
    updated_at: string;
}

interface ReviewDisplayProps {
    contentId: string;
    onClose?: () => void;
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({ contentId, onClose }) => {
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
            // Store relative to viewport? Since this might be in a scrollable div, 
            // fixed positioning might be tricky if not handled carefully.
            // Using absolute if parent is relative might be better, but fixed works for overlay.
            setSelection({ from: start, to: end, rect });
        }
    };

    const handleInlineCommentSubmit = async () => {
        if (!newCommentText.trim() || !selection) return;
        setPostingComment(true);

        if (!user) {
            alert("User information missing. Please try reloading.");
            setPostingComment(false);
            return;
        }

        const payload = {
            content_id: contentId,
            text: newCommentText,
            selection_range: { from: selection.from, to: selection.to },
            author: user.id,
            resolved: false
        };

        try {
            await api.post('/generic/comments', payload, token || undefined);
            setNewCommentText('');
            setShowCommentInput(false);
            setSelection(null);
            fetchComments();
            window.getSelection()?.removeAllRanges();
        } catch (err: any) {
            console.error(err);
            alert('Failed to post comment');
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Review Mode...</div>;
    if (!content) return <div className="p-8 text-center text-red-500">Content not found</div>;

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-purple-50">
                <div>
                    <h2 className="font-bold text-lg">Review Mode</h2>
                    <p className="text-xs text-gray-500">Reference Copy (Last Saved)</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Content Area */}
                <div className="border rounded p-4 bg-gray-50">
                    <div
                        ref={contentRef}
                        className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap relative"
                        onMouseUp={handleTextSelection}
                    >
                        {renderContentWithHighlights()}
                    </div>
                </div>

                {/* Comments List */}
                <div>
                    <div className="flex gap-2 mb-3 text-xs border-b pb-2 sticky top-0 bg-white z-10 pt-2">
                        {/* Filter Buttons */}
                        {['unresolved', 'resolved', 'all'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-2 py-1 rounded ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {filteredComments.map(comment => (
                            <div
                                key={comment.id || comment._id}
                                id={`comment-${comment.id || comment._id}`}
                                onClick={() => {
                                    setSelectedCommentId(comment.id || comment._id!);
                                    document.getElementById(`highlight-${comment.id || comment._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                onMouseEnter={() => setSelectedCommentId(comment.id || comment._id!)}
                                className={`border rounded p-3 text-sm cursor-pointer transition-colors ${selectedCommentId === (comment.id || comment._id) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400' : 'border-gray-200 hover:border-blue-300'
                                    } ${comment.resolved ? 'opacity-60' : ''}`}
                            >
                                <div className="flex justify-between mb-1 items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar name={comment.author_name || 'Unknown'} size="xs" />
                                            <span className="text-xs font-bold text-gray-700">{comment.author_name || 'Unknown'}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleResolve((comment.id || comment._id)!, comment.resolved);
                                        }}
                                        className="text-[10px] text-blue-600 hover:underline whitespace-nowrap ml-2"
                                    >
                                        {comment.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                                    </button>
                                </div>
                                <p className={comment.resolved ? 'line-through' : ''}>{comment.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Input Logic (Simplified placement) */}
            {selection && showCommentInput && (
                <div className="fixed z-50 bg-white p-3 rounded shadow-xl border w-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <h3 className="text-sm font-bold mb-2">Add Comment</h3>
                    <textarea
                        autoFocus
                        className="w-full text-sm border p-2 rounded mb-2"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowCommentInput(false)} className="text-xs text-gray-500">Cancel</button>
                        <button onClick={handleInlineCommentSubmit} className="text-xs bg-purple-600 text-white px-3 py-1 rounded">Post</button>
                    </div>
                </div>
            )}
            {/* Button trigger */}
            {selection && !showCommentInput && (
                <button
                    style={{
                        position: 'fixed',
                        top: selection.rect.top - 40,
                        left: selection.rect.left,
                        zIndex: 60
                    }}
                    onClick={() => setShowCommentInput(true)}
                    className="bg-purple-600 text-white p-2 rounded-full shadow"
                >
                    +
                </button>
            )}
        </div>
    );
};
