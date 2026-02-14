'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { TaskDetail } from './TaskDetail';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    stage: string;
    tags?: string[];
    due_date?: string;
    assignee?: any;
    assignee_name?: string;
    assigner?: any;
    assigner_name?: string;
    content_id?: any;
}

interface TaskWithComments extends Task {
    unresolvedComments?: number;
}

export const TaskManager = () => {
    const [tasks, setTasks] = useState<TaskWithComments[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) fetchTasks();
    }, [token]);

    const fetchTasks = async () => {
        try {
            const data = await api.get('/generic/tasks', token!);

            // Fetch comment stats for each task with content
            const tasksWithComments = await Promise.all(
                data.map(async (task: Task) => {
                    if (task.content_id) {
                        try {
                            const contentId = typeof task.content_id === 'string'
                                ? task.content_id
                                : task.content_id._id || task.content_id.id;

                            const stats = await api.get(`/generic/content/${contentId}/comments/stats`, token!);
                            return { ...task, unresolvedComments: stats.unresolved };
                        } catch (err) {
                            return task;
                        }
                    }
                    return task;
                })
            );

            setTasks(tasksWithComments);
        } catch (err) {
            console.error('Fetch tasks failed:', err);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim() || !token) return;
        setLoading(true);
        try {
            await api.post('/generic/tasks', {
                title: newTaskTitle.trim(),
                status: 'pending',
                priority: 'medium',
                stage: 'To Do',
                tags: []
            }, token);
            setNewTaskTitle('');
            await fetchTasks();
        } catch (err) {
            console.error('Create task failed:', err);
            alert('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (task: Task, updates: Partial<Task>) => {
        try {
            // Stripping fields not accepted by TaskCreate schema if necessary
            // But usually Pydantic ignores extra fields.
            const payload = {
                title: updates.title ?? task.title,
                description: updates.description ?? task.description,
                status: updates.status ?? task.status,
                priority: updates.priority ?? task.priority,
                stage: updates.stage ?? task.stage,
                tags: updates.tags ?? task.tags ?? [],
                due_date: updates.due_date ?? task.due_date,
                assignee: updates.assignee ?? (task.assignee ? (typeof task.assignee === 'string' ? task.assignee : task.assignee._id || task.assignee.id) : null),
                content_id: updates.content_id ?? (task.content_id ? (typeof task.content_id === 'string' ? task.content_id : task.content_id._id || task.content_id.id) : null)
            };

            await api.put(`/generic/tasks/${task.id}`, payload, token!);
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            console.error('Update task failed:', err);
            alert('Failed to update task');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Done': return 'bg-green-100 text-green-700';
            case 'Review': return 'bg-purple-100 text-purple-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getContentId = (task: Task): string | null => {
        if (!task.content_id) return null;
        if (typeof task.content_id === 'string') return task.content_id;
        return task.content_id._id || task.content_id.id || null;
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Team Tasks</h2>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                    {tasks.length} Total
                </div>
            </div>

            {/* Create Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }} className="flex gap-2 mb-8 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Quick add: what's the next task?"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-3 placeholder:text-gray-400"
                />
                <button
                    type="submit"
                    disabled={loading || !newTaskTitle.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Task'}
                </button>
            </form>

            {/* Task List */}
            <div className="space-y-3">
                {tasks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                        <div className="text-4xl mb-2 opacity-50">✨</div>
                        <p className="text-sm font-medium text-gray-400 tracking-tight">All clear! No tasks assigned.</p>
                    </div>
                )}
                {tasks.map(task => {
                    const contentId = getContentId(task);
                    return (
                        <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setEditingTask(task)}>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                        {task.priority || 'medium'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                                </div>
                                {task.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{task.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStageColor(task.stage)}`}>
                                        {task.stage || 'To Do'}
                                    </span>
                                    {task.unresolvedComments !== undefined && task.unresolvedComments > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                            {task.unresolvedComments} Comments
                                        </span>
                                    )}
                                    {contentId && (
                                        <Link
                                            href={`/dashboard/library/${contentId}/review`}
                                            className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-full transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Review Page
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 flex items-center gap-4 text-right">
                                <div className="text-right">
                                    <div className={`text-[10px] font-black uppercase tracking-wider ${task.due_date && new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-gray-500">
                                        {task.assignee_name ? `For: ${task.assignee_name}` : 'Unassigned'}
                                    </div>
                                    {task.assigner_name && (
                                        <div className="text-[9px] text-gray-400 font-medium italic">
                                            By: {task.assigner_name}
                                        </div>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                    →
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Task Detail View */}
            {editingTask && (
                <TaskDetail
                    taskId={editingTask.id}
                    onClose={() => setEditingTask(null)}
                    onUpdate={fetchTasks}
                />
            )}
        </div>
    );
};
