import { PublishingWorkflow } from '@/components/PublishingWorkflow';

export default function WorkflowPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Editorial Workflow</h1>
            <PublishingWorkflow />
        </div>
    );
}
