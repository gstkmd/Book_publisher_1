'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TaskDetail } from './TaskDetail';
import { Plus, LayoutList, LayoutGrid, Filter, Search } from 'lucide-react';
import { TaskList } from './TaskList';
import { TaskBoard } from './TaskBoard';

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
    total_time?: number;
    unresolvedComments?: number;
}

export const TaskManager = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    // Filters
    const [filterAssignee, setFilterAssignee] = useState<string>('');
    const [filterAssigner, setFilterAssigner] = useState<string>('');
    const [filterScope, setFilterScope] = useState<'my' | 'all'>('my');
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            fetchTasks();
            fetchMembers();
        }
    }, [token, filterAssignee, filterAssigner, filterScope]);

    const fetchMembers = async () => {
        try {
            const data = await api.get('/core/members', token!);
            setMembers(data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            let url = '/generic/tasks';
            const params = new URLSearchParams();

            if (filterScope === 'my' && user) {
                // "My Tasks" implies explicitly assigned to me
                params.append('assignee', user.id);
            } else {
                // All Tasks - apply individual filters if set
                if (filterAssignee) params.append('assignee', filterAssignee);
                if (filterAssigner) params.append('assigner', filterAssigner);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const data = await api.get(url, token!);

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
        } finally {
            setLoading(false);
        }
    };

    const canViewAll = user?.role === 'admin' || user?.role === 'editor_in_chief';

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <LayoutList className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Board View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setFilterScope('my')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filterScope === 'my' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            My Tasks
                        </button>
                        {canViewAll && (
                            <button
                                onClick={() => setFilterScope('all')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filterScope === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All Tasks
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {filterScope === 'all' && (
                        <>
                            <select
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">Filter by Assignee</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                ))}
                            </select>

                            <select
                                value={filterAssigner}
                                onChange={(e) => setFilterAssigner(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">Filter by Assigner</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                ))}
                            </select>
                        </>
                    )}

                    <button
                        onClick={() => setEditingTask({ id: '' } as Task)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create Task
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <TaskList tasks={tasks} onEdit={setEditingTask} />
                    ) : (
                        <TaskBoard tasks={tasks} onEdit={setEditingTask} />
                    )}
                </>
            )}

            {/* Task Detail View */}
            {editingTask && (
                <TaskDetail
                    taskId={editingTask.id || undefined}
                    onClose={() => setEditingTask(null)}
                    onUpdate={fetchTasks}
                />
            )}
        </div>
    );
};
