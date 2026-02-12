'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const PublishingWorkflow = () => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchContent();
        }
    }, [token]);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const data = await api.get('/generic/content', token!);
            setTasks(data);
        } catch (err) {
            console.error('Failed to fetch content:', err);
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (e: React.DragEvent, newStatus: string) => {
        const id = e.dataTransfer.getData('id');

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

        try {
            await api.patch(`/generic/content/${id}/status`, { status: newStatus }, token!);
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on failure
            fetchContent();
        }
    };

    const onDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('id', id);
    };

    const Column = ({ title, status, color }: { title: string, status: string, color: string }) => (
        <div
            className={`flex-1 bg-gray-50 p-4 rounded mr-4 min-h-[300px] border-t-4 ${color}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, status)}
        >
            <h3 className="font-bold mb-4 uppercase text-gray-600 text-sm tracking-wide">{title}</h3>
            {tasks.filter(t => t.status === status).map(t => (
                <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.id)}
                    className="bg-white p-3 rounded shadow mb-2 cursor-move border hover:border-blue-400"
                >
                    {t.title}
                </div>
            ))}
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading workflow...</div>;

    return (
        <div className="p-6 rounded shadow mb-8">
            <h2 className="text-xl font-bold mb-6">Workflow Board</h2>
            <div className="flex">
                <Column title="Drafting" status="draft" color="border-gray-400" />
                <Column title="In Review" status="review" color="border-yellow-400" />
                <Column title="Approved" status="approved" color="border-green-400" />
                <Column title="Published" status="published" color="border-blue-400" />
            </div>
        </div>
    );
};
