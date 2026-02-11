'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: string;
    due_date?: string;
    assignee?: any; // In real app, proper User type
}

export const TaskManager = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
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
            setTasks(data);
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
                {tasks.map(task => (
                    <div key={task._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                        <div>
                            <div className="font-semibold">{task.title}</div>
                            <div className="text-sm text-gray-500">Status: {task.status}</div>
                        </div>
                        <span className="text-xs text-gray-400">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
