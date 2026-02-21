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
            {/* Header removed as requested */}


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
