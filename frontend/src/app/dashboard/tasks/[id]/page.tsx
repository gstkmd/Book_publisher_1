'use client';

import { useParams, useRouter } from 'next/navigation';
import { TaskDetail } from '@/components/TaskDetail';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TaskPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.id as string;
    const { token } = useAuth();

    if (!token) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                <button
                    onClick={() => router.push('/dashboard/tasks')}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Tasks
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <TaskDetail
                    taskId={taskId === 'new' ? undefined : taskId}
                    onClose={() => router.push('/dashboard/tasks')}
                    onUpdate={() => { }}
                />
            </div>
        </div>
    );
}
