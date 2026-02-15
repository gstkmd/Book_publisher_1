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
    taskId?: string;
    onClose: () => void;
    onUpdate: () => void;
}

export const TaskDetail = ({ taskId, onClose, onUpdate }: TaskDetailProps) => {
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [displayTime, setDisplayTime] = useState<number>(0);
    const { token, user } = useAuth();

    useEffect(() => {
        if (token) {
            fetchMembers();
            if (taskId) {
                fetchTaskDetails();
                fetchComments();
                fetchActivity();
            } else {
                setTask({
                    title: '',
                    description: '',
                    status: 'pending',
                    priority: 'medium',
                    stage: 'To Do',
                    tags: [],
                    assignee: null,
                    assignee_name: '',
                    due_date: null,
                    start_date: null,
                    time_estimate: ''
                });
                setLoading(false);
            }
        }
    }, [token, taskId]);

    // WebSocket for real-time updates
    useEffect(() => {
        if (!taskId || !token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/generic/ws/tasks/' + taskId;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'task_update') {
                fetchTaskDetails();
                fetchActivity();
            } else if (data.type === 'new_comment') {
                fetchComments();
            }
        };

        return () => socket.close();
    }, [taskId, token]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (task?.stage === 'In Progress') {
            const updateTimer = () => {
                let accumulated = task.track_time || 0;
                if (task.timer_start) {
                    const start = new Date(task.timer_start).getTime();
                    const now = new Date().getTime();
                    accumulated += Math.floor((now - start) / 1000);
                }
                setDisplayTime(accumulated);
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setDisplayTime(task?.track_time || 0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [task?.stage, task?.track_time, task?.timer_start]);

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

    const fetchActivity = async () => {
        try {
            const data = await api.get(`/generic/tasks/${taskId}/activity`, token!);
            setActivity(data);
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        }
    };

    const fetchMembers = async () => {
        try {
            const data = await api.get('/organizations/members', token!);
            setMembers(data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        }
    };

    // Combine and sort feed
    const feed = [
        ...comments.map(c => ({ ...c, feedType: 'comment' })),
        ...activity.map(a => ({ ...a, feedType: 'activity' }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const handleUpdateField = async (field: string | Record<string, any>, value?: any) => {
        let updates: Record<string, any>;
        if (typeof field === 'string') {
            updates = { ...task, [field]: value };
        } else {
            updates = { ...task, ...field };
        }

        if (!taskId) {
            setTask(updates);
            return;
        }

        try {
            await api.put(`/generic/tasks/${taskId}`, updates, token!);
            setTask(updates);
            onUpdate();
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };

    const handleCreateTask = async () => {
        if (!task.title.trim()) {
            alert('Title is required');
            return;
        }

        try {
            setLoading(true);
            const newTask = await api.post('/generic/tasks', {
                ...task,
                assignee: task.assignee?._id || task.assignee?.id || task.assignee
            }, token!);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Failed to create task:', err);
            alert('Failed to create task');
        } finally {
            setLoading(false);
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

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                                <span className="text-xs font-bold text-gray-600">{taskId ? 'Task' : 'New Task'}</span>
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </div>
                            {taskId && (
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            )}
                            {!taskId && (
                                <button
                                    onClick={handleCreateTask}
                                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Create Task
                                </button>
                            )}
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

                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                            {/* Status */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                                </div>
                                <select
                                    value={task.stage || 'To Do'}
                                    onChange={(e) => handleUpdateField('stage', e.target.value)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-xs uppercase cursor-pointer hover:bg-indigo-100 transition-colors border-none focus:ring-0"
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <UserIcon className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Assignees</span>
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer group relative">
                                    <select
                                        value={task.assignee?._id || task.assignee?.id || task.assignee || ''}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const member = members.find(m => (m._id || m.id) === selectedId);
                                            handleUpdateField({
                                                assignee: selectedId,
                                                assignee_name: member?.full_name || ''
                                            });
                                        }}
                                        className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0"
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map(m => (
                                            <option key={m._id || m.id} value={m._id || m.id}>{m.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Dates</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors">
                                    <input
                                        type="date"
                                        value={task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleUpdateField('start_date', e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 p-0 text-xs font-bold w-24"
                                    />
                                    <span className="mx-1">→</span>
                                    <input
                                        type="date"
                                        value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleUpdateField('due_date', e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 p-0 text-xs font-bold w-24"
                                    />
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Flag className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Priority</span>
                                </div>
                                <select
                                    value={task.priority || 'medium'}
                                    onChange={(e) => handleUpdateField('priority', e.target.value)}
                                    className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 capitalize"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Time Estimate */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Time estimate</span>
                                </div>
                                <input
                                    type="text"
                                    defaultValue={task.time_estimate}
                                    onBlur={(e) => handleUpdateField('time_estimate', e.target.value)}
                                    placeholder="e.g. 2h 30m"
                                    className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-300"
                                />
                            </div>

                            {/* Track Time */}
                            <div className="flex items-center group">
                                <div className="w-32 flex items-center gap-2 text-gray-400">
                                    <Play className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Track time</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTime(displayTime)}
                                    {task.stage === 'In Progress' && (
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                        </span>
                                    )}
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
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Description</span>
                                <textarea
                                    defaultValue={task.description}
                                    onBlur={(e) => handleUpdateField('description', e.target.value)}
                                    className="w-full border border-gray-100 rounded-xl p-4 text-sm leading-relaxed text-gray-600 min-h-[150px] placeholder:text-gray-300 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none bg-gray-50/10"
                                    placeholder="Add a more detailed description..."
                                />
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
                        {feed.map((item: any, idx: number) => (
                            item.feedType === 'activity' ? (
                                <div key={`activity-${item.id}`} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        {item.user_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-bold text-gray-700 mr-1">{item.user_name === user?.full_name ? 'You' : item.user_name}</span>
                                            {item.action === 'status_change' && `changed status from ${item.old_value} to ${item.new_value}`}
                                            {item.action === 'assignee_change' && `changed assignee to ${item.new_value || 'Unassigned'}`}
                                            {item.action === 'created' && 'created this task'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase font-black">
                                            {new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div key={`comment-${item.id}`} className="flex gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                                        {item.author_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">{item.author_name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-700">
                                            {item.text}
                                        </div>
                                    </div>
                                </div>
                            )
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
