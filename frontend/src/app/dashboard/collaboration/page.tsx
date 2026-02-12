'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CommentsSidebar } from '@/components/CommentsSidebar';
import Link from 'next/link';

export default function CollaborationPage() {
    const { token } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [workflowStats, setWorkflowStats] = useState({
        draft: 0,
        review: 0,
        approved: 0,
        published: 0
    });
    const [activeTab, setActiveTab] = useState<'tasks' | 'comments' | 'workflow'>('tasks');

    useEffect(() => {
        if (token) {
            fetchTasks();
            fetchWorkflowStats();
        }
    }, [token]);

    const fetchTasks = async () => {
        try {
            const data = await api.get('/generic/tasks', token!);
            setTasks(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWorkflowStats = async () => {
        try {
            const data = await api.get('/generic/workflow/stats', token!);
            setWorkflowStats(data);
        } catch (err) {
            console.error('Failed to fetch workflow stats:', err);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Collaboration Hub</h1>
                <p className="text-gray-600">Manage comments, tasks, and workflow in one place</p>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-2 border-b-2 transition ${activeTab === 'tasks'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        📌 Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-2 border-b-2 transition ${activeTab === 'comments'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        💬 Comments
                    </button>
                    <button
                        onClick={() => setActiveTab('workflow')}
                        className={`px-4 py-2 border-b-2 transition ${activeTab === 'workflow'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        🔄 Workflow
                    </button>
                </div>
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">All Tasks</h2>
                        <Link
                            href="/dashboard/tasks"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Manage Tasks
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div key={task.id} className="border rounded p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                                {task.due_date && (
                                    <div className="text-sm text-gray-500 mt-2">
                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="text-center text-gray-500 py-12">
                                No tasks yet. Create one to get started!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Recent Comments</h2>
                    <div className="text-center text-gray-500 py-12">
                        Comments are shown in the document editor sidebar.
                        <br />
                        <Link href="/dashboard/library" className="text-blue-600 hover:underline mt-4 inline-block">
                            Go to Library to view document comments →
                        </Link>
                    </div>
                </div>
            )}

            {/* Workflow Tab */}
            {activeTab === 'workflow' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Publishing Workflow</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                            <div className="text-sm text-yellow-700 font-semibold mb-2">DRAFT</div>
                            <div className="text-2xl font-bold">{workflowStats.draft}</div>
                            <div className="text-sm text-gray-600">Items in draft</div>
                        </div>

                        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                            <div className="text-sm text-blue-700 font-semibold mb-2">REVIEW</div>
                            <div className="text-2xl font-bold">{workflowStats.review}</div>
                            <div className="text-sm text-gray-600">Under review</div>
                        </div>

                        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                            <div className="text-sm text-green-700 font-semibold mb-2">APPROVED</div>
                            <div className="text-2xl font-bold">{workflowStats.approved}</div>
                            <div className="text-sm text-gray-600">Approved items</div>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded">
                            <div className="text-sm text-indigo-700 font-semibold mb-2">PUBLISHED</div>
                            <div className="text-2xl font-bold">{workflowStats.published}</div>
                            <div className="text-sm text-gray-600">Published items</div>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/workflow"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        View Full Workflow →
                    </Link>
                </div>
            )}
        </div>
    );
}
