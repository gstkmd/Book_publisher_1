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
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import ContentReview from './ContentReview';
import { UserAvatar } from './UserAvatar';

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
    const [showReversionConfirm, setShowReversionConfirm] = useState<{ activeTaskId: string, activeTaskTitle: string, nextStage: string } | null>(null);
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

    const handleUpdateField = async (field: string | Record<string, any>, value?: any, force: boolean = false) => {
        // Enforce "One In-Progress" rule check
        if (!force && typeof field === 'string' && field === 'stage' && value === 'In Progress') {
            try {
                const status = await api.get('/generic/tasks/active-status', token!);
                if (status.active_count > 0 && status.active_task_id !== taskId) {
                    setShowReversionConfirm({
                        activeTaskId: status.active_task_id,
                        activeTaskTitle: status.active_task_title,
                        nextStage: value
                    });
                    return; // Stop and wait for confirmation
                }
            } catch (err) {
                console.error('Failed to check active status:', err);
            }
        }

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

    const handleCreateTask = async (force: boolean = false) => {
        if (!task.title.trim()) {
            alert('Title is required');
            return;
        }

        // Enforce "One In-Progress" rule check
        if (!force && task.stage === 'In Progress') {
            try {
                const status = await api.get('/generic/tasks/active-status', token!);
                if (status.active_count > 0) {
                    setShowReversionConfirm({
                        activeTaskId: status.active_task_id,
                        activeTaskTitle: status.active_task_title,
                        nextStage: 'In Progress'
                    });
                    return; // Stop and wait for confirmation
                }
            } catch (err) {
                console.error('Failed to check active status:', err);
            }
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
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!task) return null;

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300 min-h-screen">
            <div className="flex flex-1 overflow-hidden">

                {/* Left Section: Task Info */}
                <div className="flex-1 overflow-y-auto border-r border-gray-100 flex flex-col bg-white">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 rounded-full border border-slate-200/50 cursor-pointer hover:bg-slate-100 transition-all duration-200 shadow-sm group">
                                <span className={`w-2 h-2 rounded-full ${taskId ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700">{taskId ? 'Task' : 'New Task'}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-y-0.5" />
                            </div>
                            {task.content_id && (
                                <div className="flex items-center gap-1 p-1 bg-slate-50/30 border border-slate-200/30 rounded-2xl ml-2 text-nowrap">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'details'
                                            ? 'bg-white text-indigo-600 shadow-md scale-105 active:scale-95'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                            }`}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'review'
                                            ? 'bg-white text-emerald-600 shadow-md scale-105 active:scale-95'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                            }`}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Review
                                    </button>
                                    <Link
                                        href={`/dashboard/editor/${task.content_id?._id || task.content_id?.id || task.content_id}`}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-300"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Edit
                                    </Link>
                                </div>
                            )}
                            <div className="flex items-center gap-3 ml-2">
                                {isSaving ? (
                                    <div className="flex items-center gap-2 text-indigo-500">
                                        <div className="flex gap-0.5">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce"></div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500/80">Syncing</span>
                                    </div>
                                ) : lastSaved && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50/50 border border-slate-100/50">
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                            Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {taskId && (
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 active:scale-90 group">
                                    <Maximize2 className="w-4 h-4 group-hover:scale-110" />
                                </button>
                            )}
                            {!taskId && (
                                <button
                                    onClick={() => handleCreateTask()}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Submit Task
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {activeTab === 'details' ? (
                            <>
                                {/* Title */}
                                <div>
                                    <input
                                        type="text"
                                        value={task.title}
                                        onChange={(e) => handleUpdateField('title', e.target.value)}
                                        className="text-2xl font-extrabold text-gray-900 w-full border-none focus:ring-0 p-0 placeholder:text-gray-200"
                                        placeholder="Task Title"
                                    />
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Status */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <CheckCircle2 className="w-3.5 h-3.5 group-hover:text-indigo-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Workflow State</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={task.stage || 'To Do'}
                                                onChange={(e) => handleUpdateField('stage', e.target.value)}
                                                className={`w-full appearance-none px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer border-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm ${task.stage === 'Done' ? 'bg-emerald-50 text-emerald-700' :
                                                    task.stage === 'Review' ? 'bg-amber-50 text-amber-700' :
                                                        task.stage === 'In Progress' ? 'bg-indigo-50 text-indigo-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                <option value="To Do">To Do</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Review">Review</option>
                                                <option value="Done">Done</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Flag className="w-3.5 h-3.5 group-hover:text-red-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Priority Level</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={task.priority || 'medium'}
                                                onChange={(e) => handleUpdateField('priority', e.target.value)}
                                                className={`w-full appearance-none px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer border-none focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm ${task.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                                                    task.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                                                        task.priority === 'medium' ? 'bg-indigo-50 text-indigo-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                        </div>
                                    </div>

                                    {/* Assignee */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <UserIcon className="w-3.5 h-3.5 group-hover:text-violet-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Assignee</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/50 p-1 rounded-xl border border-slate-100 transition-all group-hover:border-violet-100 group-hover:bg-white">
                                            {task.assignee_name && <UserAvatar name={task.assignee_name} size="sm" className="ring-2 ring-white shadow-sm" />}
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
                                                className="flex-1 text-xs font-black text-slate-700 bg-transparent border-none focus:ring-0 p-0 uppercase tracking-widest"
                                            >
                                                <option value="">Unassigned</option>
                                                {members.map(m => (
                                                    <option key={m._id || m.id} value={m._id || m.id}>{m.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Timeline</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-1">
                                            <input
                                                type="date"
                                                value={task.start_date ? new Date(new Date(task.start_date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleUpdateField('start_date', e.target.valueAsDate?.toISOString())}
                                                className="bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-blue-100 text-[11px] font-black text-slate-600 uppercase tracking-tighter w-full transition-all"
                                            />
                                            <span className="text-slate-300 font-bold">→</span>
                                            <input
                                                type="date"
                                                value={task.due_date ? new Date(new Date(task.due_date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleUpdateField('due_date', e.target.valueAsDate?.toISOString())}
                                                className="bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-blue-100 text-[11px] font-black text-slate-600 uppercase tracking-tighter w-full transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Time Economics */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5 group-hover:text-amber-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Allocated Time</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-slate-100/50 rounded-xl px-3 py-1.5 gap-2 flex-1 group-hover:bg-white group-hover:border group-hover:border-slate-100 transition-all">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    defaultValue={parseEstimate(task.time_estimate).h}
                                                    onBlur={(e) => handleUpdateEstimate(e.target.value, parseEstimate(task.time_estimate).m)}
                                                    className="w-8 text-[11px] font-black text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-center"
                                                />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hrs</span>
                                            </div>
                                            <div className="flex items-center bg-slate-100/50 rounded-xl px-3 py-1.5 gap-2 flex-1 group-hover:bg-white group-hover:border group-hover:border-slate-100 transition-all">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    defaultValue={parseEstimate(task.time_estimate).m}
                                                    onBlur={(e) => handleUpdateEstimate(parseEstimate(task.time_estimate).h, e.target.value)}
                                                    className="w-8 text-[11px] font-black text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-center"
                                                />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Tracking */}
                                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 hover:bg-indigo-50 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 group">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <Play className={`w-3.5 h-3.5 ${task.stage === 'In Progress' ? 'animate-pulse text-indigo-600' : ''}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Actual Usage</span>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl shadow-sm border border-indigo-100/30 group-hover:border-indigo-200 transition-all">
                                            <span className={`text-xl font-black tabular-nums tracking-tighter ${task.stage === 'In Progress' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {formatTime(displayTime)}
                                            </span>
                                            {task.stage === 'In Progress' && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tags & Linked Content Full Width Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    {/* Tags Container */}
                                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/30 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Tag className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Classifiers</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="+ Add Classification"
                                                className="text-[10px] font-black text-indigo-400 placeholder:text-slate-300 bg-transparent border-none focus:ring-0 p-0 w-32 text-right uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddTag(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {task.tags?.map((t: string) => (
                                                <span key={t} className="px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-lg border border-indigo-100/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group/tag hover:bg-indigo-600 hover:text-white transition-all duration-300 transform hover:scale-105 cursor-default">
                                                    {t}
                                                    <X className="w-3 h-3 cursor-pointer hover:rotate-90 transition-transform" onClick={() => handleRemoveTag(t)} />
                                                </span>
                                            ))}
                                            {(!task.tags || task.tags.length === 0) && (
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest leading-[30px]">No classifications assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Linked Workspace Content */}
                                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/30 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Target Content</span>
                                        </div>
                                        <div className="relative group/select">
                                            <select
                                                value={task.content_id?._id || task.content_id?.id || task.content_id || ''}
                                                onChange={(e) => handleUpdateField('content_id', e.target.value || null)}
                                                className="w-full appearance-none bg-slate-100/50 hover:bg-white px-4 py-2 rounded-xl border border-transparent hover:border-indigo-100 transition-all text-xs font-black text-slate-600 uppercase tracking-widest outline-none pr-10"
                                            >
                                                <option value="">None Linked</option>
                                                {libraryContent.map(c => (
                                                    <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments & Links */}
                                <div className="grid grid-cols-2 gap-8 pt-2 border-t border-gray-50">
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
                                <div className="space-y-4 pt-2 border-t border-gray-50">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Description</span>
                                        <textarea
                                            value={task.description}
                                            onChange={(e) => handleUpdateField('description', e.target.value)}
                                            className="w-full border border-gray-100 rounded-xl p-4 text-sm leading-relaxed text-gray-600 min-h-[100px] placeholder:text-gray-300 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none bg-gray-50/10"
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

                {/* Sidebar: Activity & Feed */}
                <div className="w-96 flex flex-col bg-slate-50/50 border-l border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-200/50 bg-white">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-900">Collaboration Feed</h3>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                <Search className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team interaction and log</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {feed.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 opacity-40">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">No activity logged yet</p>
                            </div>
                        )}
                        {feed.map((item: any, idx) => (
                            <div key={idx} className={`relative flex gap-1 ${item.feedType === 'comment' ? 'flex-col' : 'items-center py-2'}`}>
                                {item.feedType === 'comment' ? (
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                                        <div className="flex items-center gap-2 mb-3">
                                            <UserAvatar name={item.author_name} size="sm" className="ring-2 ring-indigo-50" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{item.author_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button className="ml-auto p-1 text-slate-200 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.text}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                                            <AlertCircle className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                                <span className="font-black text-slate-700 uppercase tracking-tight">{item.user_name}</span> {item.description}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Comment Input Area */}
                    <div className="p-5 bg-white border-t border-slate-100">
                        <form onSubmit={handleAddComment} className="relative bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 transition-all p-2 group">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-transparent border-none focus:ring-0 p-3 text-xs text-slate-600 placeholder:text-slate-400 resize-none min-h-[100px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(e as any);
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between px-2 pb-2">
                                <div className="flex items-center gap-1">
                                    <button type="button" className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-xl transition-all"><Smile className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-xl transition-all"><AtSign className="w-4 h-4" /></button>
                                    <button type="button" className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-xl transition-all"><Paperclip className="w-4 h-4" /></button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:shadow-indigo-200 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all duration-300"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>

            {/* Reversion Confirmation Portal */}
            {showReversionConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6 border-4 border-amber-100">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-3">Active Task Detected</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                                You currently have <span className="font-black text-slate-900 italic">"{showReversionConfirm.activeTaskTitle}"</span> in progress. Moving this task to <span className="text-indigo-600 font-bold uppercase tracking-widest">{showReversionConfirm.nextStage}</span> will pause and revert the other one.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowReversionConfirm(null)}
                                    className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleUpdateField('stage', showReversionConfirm.nextStage, true);
                                        setShowReversionConfirm(null);
                                    }}
                                    className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
