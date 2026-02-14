'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    X,
    Calendar,
    User as UserIcon,
    Flag,
    Tag,
    Clock,
    Plus,
    ChevronDown,
    Search,
    Maximize2,
    Send,
    Smile,
    AtSign,
    Paperclip,
    MoreHorizontal,
    CheckCircle2,
    Play
} from 'lucide-react';

interface TaskDetailProps {
    taskId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export const TaskDetail = ({ taskId, onClose, onUpdate }: TaskDetailProps) => {
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();

    useEffect(() => {
        if (token && taskId) {
            fetchTaskDetails();
            fetchComments();
        }
    }, [token, taskId]);

    const fetchTaskDetails = async () => {
        try {
            const tasks = await api.get('/generic/tasks', token!);
            const foundTask = tasks.find((t: any) => t.id === taskId);
            setTask(foundTask);
        } catch (err) {
            console.error('Failed to fetch task details:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await api.get(`/generic/tasks/${taskId}/comments`, token!);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        }
    };

    const handleUpdateField = async (field: string, value: any) => {
        try {
            const updates = { ...task, [field]: value };
            await api.put(`/generic/tasks/${taskId}`, updates, token!);
            setTask(updates);
            onUpdate();
        } catch (err) {
            console.error(`Failed to update ${field}:`, err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const comment = await api.post(`/generic/tasks/${taskId}/comments`, {
                task_id: taskId,
                text: newComment.trim()
            }, token!);
            setComments([...comments, comment]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4">
            <div className="bg-white w-full max-w-[1200px] h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Left Section: Task Info */}
                <div className="flex-1 overflow-y-auto border-r border-gray-100 flex flex-col bg-white">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                <span className="text-xs font-bold text-gray-600">Task</span>
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Title */}
                        <div className="space-y-4">
                            <input
                                type="text"
                                defaultValue={task.title}
                                onBlur={(e) => handleUpdateField('title', e.target.value)}
                                className="text-4xl font-extrabold text-gray-900 w-full border-none focus:ring-0 p-0 placeholder:text-gray-200"
                                placeholder="Task Title"
                            />

                            <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50 group cursor-pointer transition-all hover:bg-indigo-50">
                                <span className="text-indigo-600">✨</span>
                                <span className="text-sm font-medium text-indigo-700/70">Ask AI to create a summary, generate subtasks or find similar tasks</span>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                            {/* Status */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-xs uppercase cursor-pointer hover:bg-indigo-100 transition-colors">
                                    {task.stage || 'To Do'}
                                    <ChevronDown className="w-3 h-3" />
                                </div>
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <UserIcon className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Assignees</span>
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer group">
                                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                                        {task.assignee_name?.split(' ').map((n: string) => n[0]).join('') || 'AR'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{task.assignee_name || 'Unassigned'}</span>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Dates</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Start'}
                                    <span className="mx-1">→</span>
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'End'}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Flag className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Priority</span>
                                </div>
                                <div className="text-xs font-bold text-gray-300 hover:text-gray-500 cursor-pointer flex items-center gap-1 transition-colors capitalize">
                                    {task.priority || 'Empty'}
                                </div>
                            </div>

                            {/* Time Estimate */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Time estimate</span>
                                </div>
                                <div className="text-xs font-bold text-gray-300 hover:text-gray-500 cursor-pointer transition-colors">
                                    {task.time_estimate || 'Empty'}
                                </div>
                            </div>

                            {/* Track Time */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Play className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Track time</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors">
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Start
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Tag className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Tags</span>
                                </div>
                                <div className="text-xs font-bold text-gray-300 hover:text-gray-500 cursor-pointer transition-colors">
                                    Empty
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <textarea
                                defaultValue={task.description}
                                onBlur={(e) => handleUpdateField('description', e.target.value)}
                                className="w-full border-none focus:ring-0 p-0 text-sm leading-relaxed text-gray-600 min-h-[100px] placeholder:text-gray-200"
                                placeholder="Add a more detailed description..."
                            />
                        </div>

                        {/* Custom Fields */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <ChevronDown className="w-4 h-4" />
                                    <span className="text-sm font-black uppercase tracking-wider">Custom Fields</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    <Maximize2 className="w-4 h-4 text-gray-400" />
                                    <Plus className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                {[
                                    'Client Mail', 'Client Name', 'Client Notified',
                                    'Client Phone', 'Comment For communi...',
                                    'Completion Infomation', 'Dealing Name',
                                    'Dealing Phone', 'Last Reminder Date'
                                ].map(field => (
                                    <div key={field} className="grid grid-cols-2 py-2.5 border-b border-gray-50 group transition-colors hover:bg-gray-50/50 px-2 rounded-lg">
                                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                            <div className="w-4 h-4 flex items-center justify-center border border-gray-200 rounded text-[9px]">T</div>
                                            {field}
                                        </div>
                                        <div className="text-xs font-medium text-gray-300 group-hover:text-gray-500 transition-colors">
                                            {task.custom_fields?.[field] || '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Activity Feed */}
                <div className="w-[400px] flex flex-col bg-gray-50/50">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Activity</h3>
                        <div className="flex items-center gap-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <div className="relative">
                                <AtSign className="w-4 h-4 text-gray-400" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border-2 border-white rounded-full"></span>
                            </div>
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Audit Log Items */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">
                                    <span className="font-bold text-gray-700 mr-1">You</span> created this task
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase font-black">Aug 25 2025 at 11:46 am</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-2 border-y border-gray-100 group cursor-pointer">
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show more</span>
                        </div>

                        {/* Real Comments */}
                        {comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                                    {comment.author_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-900">{comment.author_name}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-700">
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comment Input */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        <form
                            onSubmit={handleAddComment}
                            className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm focus-within:border-indigo-500 transition-all"
                        >
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full border-none focus:ring-0 p-0 text-sm placeholder:text-gray-300 min-h-[40px] resize-none"
                            />
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <Plus className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                                    <div className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded flex items-center gap-1 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                                        Comment
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                    <Smile className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                                    <AtSign className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                                    <div className="w-[1px] h-4 bg-gray-100 mx-1" />
                                    <Paperclip className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="p-1.5 bg-gray-50 text-gray-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
