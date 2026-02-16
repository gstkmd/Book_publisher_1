'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
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
    Play,
    ExternalLink,
    FileText,
    MessageSquare
} from 'lucide-react';
import ContentReview from './ContentReview';

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
    const [libraryContent, setLibraryContent] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [displayTime, setDisplayTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'details' | 'review'>('details');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { token, user } = useAuth();

    useEffect(() => {
        if (token) {
            fetchMembers();
            fetchLibraryContent();
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
                let accumulated = (task.track_time || 0);
                // Note: task.total_time from backend is used for display in the list, 
                // but here in detail we might want to stick to task's own time + session.
                // Or if we want to show the accumulated tree time here too:
                // accumulated = task.total_time || task.track_time || 0;

                if (task.timer_start) {
                    const startTimeStr = task.timer_start;
                    const startTime = new Date(startTimeStr).getTime();
                    if (!isNaN(startTime)) {
                        const now = new Date().getTime();
                        accumulated += Math.floor((now - startTime) / 1000);
                    }
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

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

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

    const fetchLibraryContent = async () => {
        try {
            const data = await api.get('/generic/content', token!);
            setLibraryContent(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch library content:', err);
        }
    };

    // Combine and sort feed
    const feed = [
        ...comments.map(c => ({ ...c, feedType: 'comment' })),
        ...activity.map(a => ({ ...a, feedType: 'activity' }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const handleUpdateField = (field: string | Record<string, any>, value?: any) => {
        let updates: Record<string, any>;
        if (typeof field === 'string') {
            updates = { ...task, [field]: value };
        } else {
            updates = { ...task, ...field };
        }

        // Update local state immediately for responsive UI
        let finalUpdates = updates;
        if (typeof field === 'string' && field === 'stage' && value === 'In Progress') {
            finalUpdates = { ...updates, timer_start: new Date().toISOString() };
        }
        setTask(finalUpdates);

        if (!taskId) {
            return;
        }

        // Debounce saving
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        setIsSaving(true);
        saveTimerRef.current = setTimeout(async () => {
            try {
                const response = await api.put(`/generic/tasks/${taskId}`, updates, token!);
                // Only update from server if we are not currently saving something else 
                // to avoid race conditions and cursor jumps in controlled inputs
                setTask((prev: any) => ({ ...prev, ...response }));
                setLastSaved(new Date());
                onUpdate();
            } catch (err) {
                console.error('Failed to update task:', err);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1 second lag as requested
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

    const parseEstimate = (estimate: string) => {
        const hMatch = estimate?.match(/(\d+)h/);
        const mMatch = estimate?.match(/(\d+)m/);
        return {
            h: hMatch ? hMatch[1] : '',
            m: mMatch ? mMatch[1] : ''
        };
    };

    const handleUpdateEstimate = (h: string, m: string) => {
        const estimate = `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim();
        handleUpdateField('time_estimate', estimate);
    };

    const handleAddTag = (tag: string) => {
        if (!tag.trim() || task.tags.includes(tag.trim())) return;
        handleUpdateField('tags', [...task.tags, tag.trim()]);
    };

    const handleRemoveTag = (tag: string) => {
        handleUpdateField('tags', task.tags.filter((t: string) => t !== tag));
    };

    const [showLinkInput, setShowLinkInput] = useState(false);
    const [newLink, setNewLink] = useState({ label: '', url: '' });

    const handleAddLink = () => {
        if (newLink.label && newLink.url) {
            handleUpdateField('links', [...(task.links || []), newLink]);
            setNewLink({ label: '', url: '' });
            setShowLinkInput(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !taskId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await api.post(`/generic/upload`, formData, token!, true); // Assuming 4th arg is isFormData
            const attachToAdd = {
                name: file.name,
                url: result.url
            };
            handleUpdateField('attachments', [...(task.attachments || []), attachToAdd]);
        } catch (err) {
            console.error('Failed to upload file:', err);
            alert('Failed to upload file');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
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
                            {task.content_id && (
                                <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-100 rounded-xl ml-2 text-nowrap">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'review'
                                            ? 'bg-white text-teal-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <FileText className="w-3 h-3" />
                                        Review Content
                                    </button>
                                    <Link
                                        href={`/dashboard/editor/${task.content_id?._id || task.content_id?.id || task.content_id}`}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-white transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Edit
                                    </Link>
                                </div>
                            )}
                            {isSaving ? (
                                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Saving...</span>
                                </div>
                            ) : lastSaved && (
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            {taskId && (
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {!taskId && (
                            <button
                                onClick={handleCreateTask}
                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
                            >
                                <Plus className="w-3 h-3" />
                                Create Task
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {activeTab === 'details' ? (
                            <>
                                {/* Title */}
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={task.title}
                                        onChange={(e) => handleUpdateField('title', e.target.value)}
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
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                handleUpdateField('stage', newVal);
                                            }}
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
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                handleUpdateField('priority', newVal);
                                            }}
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
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Hr"
                                                defaultValue={parseEstimate(task.time_estimate).h}
                                                onBlur={(e) => handleUpdateEstimate(e.target.value, parseEstimate(task.time_estimate).m)}
                                                className="w-12 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">H</span>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                defaultValue={parseEstimate(task.time_estimate).m}
                                                onBlur={(e) => handleUpdateEstimate(parseEstimate(task.time_estimate).h, e.target.value)}
                                                className="w-12 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">M</span>
                                        </div>
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
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {task.tags?.map((t: string) => (
                                                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold flex items-center gap-1 group/tag">
                                                    {t}
                                                    <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity" onClick={() => handleRemoveTag(t)} />
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                placeholder="+ Tag"
                                                className="text-[10px] font-bold text-gray-400 bg-transparent border-none focus:ring-0 p-0 w-16"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddTag(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Linked Content */}
                                    <div className="flex items-center group">
                                        <div className="w-32 flex items-center gap-2 text-gray-400">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Linked Content</span>
                                        </div>
                                        <select
                                            value={task.content_id?._id || task.content_id?.id || task.content_id || ''}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                handleUpdateField('content_id', newVal || null);
                                            }}
                                            className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 max-w-[200px] truncate"
                                        >
                                            <option value="">None</option>
                                            {libraryContent.map(c => (
                                                <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Attachments & Links */}
                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Paperclip className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Attachments</span>
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                                disabled={!taskId}
                                                title={!taskId ? "Save task first to add attachments" : "Upload File"}
                                            >
                                                <Plus className={`w-3.5 h-3.5 ${!taskId ? 'text-gray-300' : 'text-indigo-600'}`} />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            {task.attachments?.map((a: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                                                            {a.name.split('.').pop()}
                                                        </div>
                                                        <a href={a.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 truncate hover:text-indigo-600 transition-colors">{a.name}</a>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUpdateField('attachments', task.attachments.filter((_: any, i: number) => i !== idx))}
                                                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!task.attachments || task.attachments.length === 0) && (
                                                <div className="text-[10px] font-bold text-gray-300 uppercase italic">No files attached</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <AtSign className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">External Links</span>
                                            </div>
                                            <button onClick={() => setShowLinkInput(true)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {showLinkInput && (
                                                <div className="p-3 bg-white border border-indigo-100 rounded-lg shadow-sm space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                    <input
                                                        type="text"
                                                        placeholder="Link Label (e.g. Drive)"
                                                        value={newLink.label}
                                                        onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                                        className="w-full text-xs p-2 border border-gray-100 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="URL"
                                                        value={newLink.url}
                                                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                                        className="w-full text-xs p-2 border border-gray-100 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setShowLinkInput(false)} className="text-[10px] font-bold text-gray-400 uppercase">Cancel</button>
                                                        <button onClick={handleAddLink} className="text-[10px] font-bold text-indigo-600 uppercase">Add</button>
                                                    </div>
                                                </div>
                                            )}
                                            {task.links?.map((l: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-100">
                                                            <Maximize2 className="w-3 h-3 text-indigo-500" />
                                                        </div>
                                                        <a href={l.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 truncate hover:text-indigo-600 transition-colors">{l.label}</a>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUpdateField('links', task.links.filter((_: any, i: number) => i !== idx))}
                                                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!task.links || task.links.length === 0) && (
                                                <div className="text-[10px] font-bold text-gray-300 uppercase italic">No external links</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Description</span>
                                        <textarea
                                            value={task.description}
                                            onChange={(e) => handleUpdateField('description', e.target.value)}
                                            className="w-full border border-gray-100 rounded-xl p-4 text-sm leading-relaxed text-gray-600 min-h-[150px] placeholder:text-gray-300 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none bg-gray-50/10"
                                            placeholder="Add a more detailed description..."
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <ContentReview
                                contentId={task.content_id?._id || task.content_id?.id || task.content_id}
                                showSidebar={true}
                                isEmbedded={true}
                            />
                        )}
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
