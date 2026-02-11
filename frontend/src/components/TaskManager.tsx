'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: string;
    due_date?: string;
    assignee?: any;
    content_id?: any;
}

interface TaskWithComments extends Task {
    unresolvedComments?: number;
}

export const TaskManager = () => {
    const [tasks, setTasks] = useState<TaskWithComments[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [token]);

    const fetchTasks = async () => {
        if (!token) return;
        try {
            const data = await api.get('/generic/tasks', token);

            // Fetch comment stats for each task with content
            const tasksWithComments = await Promise.all(
                data.map(async (task: Task) => {
                    if (task.content_id) {
                        try {
                            const contentId = typeof task.content_id === 'string'
                                ? task.content_id
                                : task.content_id._id || task.content_id.id;

                            const stats = await api.get(`/generic/content/${contentId}/comments/stats`, token);
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
            console.error(err);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle) return;
        setLoading(true);
        try {
            await api.post('/generic/tasks', {
                title: newTaskTitle,
                status: 'pending'
            }, token || undefined);
            setNewTaskTitle('');
            fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const getContentId = (task: Task): string | null => {
        if (!task.content_id) return null;
        if (typeof task.content_id === 'string') return task.content_id;
        return task.content_id._id || task.content_id.id || null;
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">My Tasks</h2>

            {/* Create Bar */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New task title..."
                    className="flex-1 p-2 border rounded"
                />
                <button
                    onClick={handleCreateTask}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Task'}
                </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
                {tasks.length === 0 && <p className="text-gray-500">No tasks assigned.</p>}
                {tasks.map(task => {
                    const contentId = getContentId(task);
                    return (
                        <div key={task._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                            <div className="flex-1">
                                <div className="font-semibold">{task.title}</div>
                                {task.description && (
                                    <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-xs px-2 py-1 rounded ${task.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : task.status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {task.status}
                                    </span>
                                    {task.unresolvedComments !== undefined && task.unresolvedComments > 0 && (
                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                            {task.unresolvedComments} unresolved comment{task.unresolvedComments !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {contentId && (
                                        <Link
                                            href={`/dashboard/library/${contentId}/review`}
                                            className="text-xs text-teal-600 hover:text-teal-800 underline"
                                        >
                                            → Review Content
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 ml-4">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
