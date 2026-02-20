import React from 'react';
import { MoreHorizontal, MessageSquare, Clock } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    stage: string;
    tags?: string[];
    due_date?: string;
    assignee?: any;
    assignee_name?: string;
    assigner?: any;
    assigner_name?: string;
    content_id?: any;
    total_time?: number;
    unresolvedComments?: number;
}

interface TaskListProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            case 'high': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
            case 'medium': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            case 'low': return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20';
            default: return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Done': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'Review': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';
            case 'In Progress': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
            default: return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20';
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl grayscale">✨</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
                <p className="text-gray-500 text-sm mt-1">Adjust your filters or create a new task to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/3">Task</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Assignee</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
                            {/* Actions column removed */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() => onEdit(task)}
                                className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                            >
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {task.title}
                                        </span>
                                        {task.description && (
                                            <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                {task.description}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            {task.unresolvedComments !== undefined && task.unresolvedComments > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {task.unresolvedComments}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 align-top">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStageColor(task.stage)}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-50"></span>
                                        {task.stage}
                                    </span>
                                    {task.total_time !== undefined && task.total_time > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(task.total_time)}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 align-top">
                                    {task.assignee_name ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {task.assignee_name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{task.assignee_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 align-top">
                                    {task.due_date ? (
                                        <div className={`text-sm font-medium ${new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                                            {new Date(task.due_date).toLocaleDateString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                timeZone: 'Asia/Kolkata'
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-300">-</span>
                                    )}
                                </td>
                                {/* Actions column removed */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

