'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { Search, MessageSquare, Send, Smile, AtSign, Paperclip, MoreHorizontal } from 'lucide-react';

interface Comment {
    id?: string;
    _id?: string;
    text: string;
    author: any; // In real app, User type
    author_name?: string;
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
            if (Array.isArray(data)) {
                setComments(data);
            } else {
                setComments([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await api.post('/generic/comments', {
                content_id: documentId,
                text: newComment,
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
        <div className="w-80 flex flex-col bg-slate-50/50 border-l border-slate-100 overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900">Content Discussion</h3>
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <Search className="w-3 h-3" />
                    </button>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Editorial feedback and notes</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 opacity-40">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No comments yet</p>
                    </div>
                )}
                {comments.map((c) => (
                    <div key={c.id || c._id} className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-1.5 mb-2">
                            <UserAvatar name={c.author_name || 'Unknown'} size="xs" className="ring-1 ring-indigo-50" />
                            <div>
                                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">{c.author_name || 'Unknown'}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button className="ml-auto p-1 text-slate-200 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-3 h-3" />
                            </button>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{c.text}</p>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleAddComment} className="relative bg-slate-50 rounded-xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 transition-all p-1.5 group">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-none focus:ring-0 p-2 text-[11px] text-slate-600 placeholder:text-slate-400 resize-none min-h-[60px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between px-1 pb-1">
                        <div className="flex items-center gap-0.5">
                            <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-lg transition-all"><Smile className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-lg transition-all"><AtSign className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-lg transition-all"><Paperclip className="w-3.5 h-3.5" /></button>
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim() || loading}
                            className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:shadow-indigo-200 active:scale-95 disabled:opacity-30 transition-all duration-300"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
