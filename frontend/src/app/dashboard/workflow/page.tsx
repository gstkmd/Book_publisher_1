'use client';

import { PublishingWorkflow } from '@/components/PublishingWorkflow';
import ModuleGuard from '@/components/ModuleGuard';

export default function WorkflowPage() {
    return (
        <ModuleGuard moduleName="tasks">
            <div className="container mx-auto py-8 text-slate-900">
                <h1 className="text-3xl font-black mb-8 uppercase tracking-tight">Editorial Workflow</h1>
                <PublishingWorkflow />
            </div>
        </ModuleGuard>
    );
}
