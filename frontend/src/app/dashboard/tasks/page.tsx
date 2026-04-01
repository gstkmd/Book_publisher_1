'use client';

import { TaskManager } from '@/components/TaskManager';
import ModuleGuard from '@/components/ModuleGuard';

export default function TasksPage() {
    return (
        <ModuleGuard moduleName="tasks">
            <div className="container mx-auto py-8 text-slate-900">
                <h1 className="text-3xl font-black mb-8 uppercase tracking-tight">Task Management</h1>
                <TaskManager />
            </div>
        </ModuleGuard>
    );
}
