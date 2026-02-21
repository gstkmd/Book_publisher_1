import { TaskManager } from '@/components/TaskManager';

export default function TasksPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Task Management</h1>
            <TaskManager />
        </div>
    );
}
