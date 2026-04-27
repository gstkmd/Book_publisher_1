'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';
import { IntegrityService, IntegrityReport } from '@/lib/services/IntegrityService';

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
    latest_integrity_report?: any;
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

    // Integrity State
    const [auditOptions, setAuditOptions] = useState({ checkAI: true, checkCopyright: true });
    const [auditing, setAuditing] = useState(false);
    const [auditReport, setAuditReport] = useState<IntegrityReport | null>(null);
    const [showIntegrityDashboard, setShowIntegrityDashboard] = useState(false);

    useEffect(() => {
        if (token && contentId) {
            fetchContent();
            fetchComments();
        }
    }, [token, contentId]);

    useEffect(() => {
        if (content?.latest_integrity_report) {
            setAuditReport(content.latest_integrity_report as IntegrityReport);
        }
    }, [content]);

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
                // If it's a string and not JSON, it's likely the new HTML format
                // Strip tags for offset-based commenting logic
                return body.replace(/<[^>]+>/g, ' ');
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

    const runFullAudit = async () => {
        if (!token || !contentId) return;
        setAuditing(true);
        setAuditReport(null);
        try {
            const report = await IntegrityService.checkFull(contentId, auditOptions, token);
            setAuditReport(report);
            toast.success('Integrity audit complete');
        } catch (err) {
            console.error(err);
            toast.error('Audit failed');
        } finally {
            setAuditing(false);
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
                <div className="text-sm text-gray-600 mb-6 flex items-center justify-between">
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
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-base md:text-lg">Review Panel</h2>
                            <button
                                onClick={() => setShowIntegrityDashboard(!showIntegrityDashboard)}
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${showIntegrityDashboard ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    }`}
                            >
                                {showIntegrityDashboard ? 'Show Comments' : 'Integrity Scan'}
                            </button>
                        </div>

                        {showIntegrityDashboard ? (
                            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in slide-in-from-right-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Auditor
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <label className="flex items-center gap-3 text-xs cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={auditOptions.checkAI}
                                            onChange={(e) => setAuditOptions({ ...auditOptions, checkAI: e.target.checked })}
                                            className="rounded border-indigo-300 text-indigo-600 outline-none"
                                        />
                                        <span className="text-indigo-900 group-hover:text-indigo-700 font-medium">Verify AI Written</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-xs cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={auditOptions.checkCopyright}
                                            onChange={(e) => setAuditOptions({ ...auditOptions, checkCopyright: e.target.checked })}
                                            className="rounded border-indigo-300 text-indigo-600 outline-none"
                                        />
                                        <span className="text-indigo-900 group-hover:text-indigo-700 font-medium">Scan for Copyright</span>
                                    </label>
                                </div>

                                <button
                                    onClick={runFullAudit}
                                    disabled={auditing || (!auditOptions.checkAI && !auditOptions.checkCopyright)}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                                >
                                    {auditing ? 'Analyzing Content...' : 'Run Full Manuscript Audit'}
                                </button>

                                {auditReport && (
                                    <div className="mt-4 space-y-3 animate-fade-in">
                                        <div className="pb-2 border-b border-indigo-100 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Audit Results</span>
                                            <span className="text-[9px] text-indigo-300 font-bold">Latest Scan</span>
                                        </div>

                                        {/* Summary Always Visible */}
                                        <div className="text-[10px] text-indigo-700 bg-white p-2 rounded border border-indigo-100 shadow-sm leading-relaxed">
                                            <span className="font-bold">Summary:</span> {auditReport.summary || "Analysis complete."}
                                        </div>

                                        {auditReport.ai_score !== null && auditReport.ai_score !== undefined && (
                                            <div className="bg-white p-3 rounded border border-indigo-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-600">AI Probability</span>
                                                    <span className={`text-sm font-black ${(auditReport.ai_score > 0.7) ? 'text-red-600' : 'text-green-600'}`}>
                                                        {(auditReport.ai_score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${auditReport.ai_score > 0.7 ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${auditReport.ai_score * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {auditReport.plagiarism_matches !== null && auditReport.plagiarism_matches !== undefined && (
                                            <div className="bg-white p-3 rounded border border-indigo-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] uppercase font-bold text-gray-600">Copyright Signal</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${auditReport.plagiarism_matches.length > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                                        }`}>
                                                        {auditReport.plagiarism_matches.length > 0 ? 'Conflict Found' : 'Clean'}
                                                    </span>
                                                </div>

                                                {auditReport.plagiarism_matches.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {auditReport.plagiarism_matches.map((match, i) => (
                                                            <div key={i} className="text-[10px] border-l-2 border-red-200 pl-2 py-1">
                                                                <div className="font-bold text-gray-800 line-clamp-1">{match.title}</div>
                                                                <a href={match.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline line-clamp-1 truncate block">{match.url}</a>
                                                                <div className="text-gray-500 italic mt-0.5 line-clamp-2">Matches: "{match.matched_text}"</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500 text-center font-medium">No external matches detected on the web.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
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
                        )}
                    </div>

                    {!showIntegrityDashboard && (
                        <div className="p-4 max-h-[calc(100vh-350px)] overflow-y-auto space-y-4">
                            {filteredComments.length === 0 && (
                                <p className="text-gray-600 italic text-sm text-center py-8">
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
                    )}
                </div>
            )}
        </div>
    );
}
