import { TaskManager } from '@/components/TaskManager';

export default function TasksPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-red-600 border-4 border-red-600 p-4">Task Management (REFACTOR VERIFIED)</h1>
            <TaskManager />
        </div>
    );
}
