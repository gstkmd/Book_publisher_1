import React from 'react';
import { MoreHorizontal, MessageSquare, Clock, Plus } from 'lucide-react';

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

interface TaskBoardProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onEdit }) => {
    const stages = ['To Do', 'In Progress', 'Review', 'Done'];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            case 'high': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
            case 'medium': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            case 'low': return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20';
            default: return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20';
        }
    };

    const getStageTasks = (stage: string) => {
        return tasks.filter(task => task.stage === stage);
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
            {stages.map(stage => {
                const stageTasks = getStageTasks(stage);
                return (
                    <div key={stage} className="flex-shrink-0 w-80 lg:w-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${stage === 'Done' ? 'bg-emerald-500' :
                                    stage === 'Review' ? 'bg-purple-500' :
                                        stage === 'In Progress' ? 'bg-indigo-500' :
                                            'bg-slate-400'
                                    }`}></span>
                                {stage}
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {stageTasks.length}
                            </span>
                        </div>

                        <div className="space-y-3 min-h-[200px]">
                            {stageTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onEdit(task)}
                                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        {task.unresolvedComments !== undefined && task.unresolvedComments > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                                <MessageSquare className="w-3 h-3" />
                                                {task.unresolvedComments}
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {task.title}
                                    </h4>

                                    {task.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                                        <div className="flex items-center gap-2">
                                            {task.assignee_name ? (
                                                <div
                                                    className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold"
                                                    title={`Assigned to ${task.assignee_name}`}
                                                >
                                                    {task.assignee_name.charAt(0)}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <span className="sr-only">Unassigned</span>
                                                    ?
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            {task.due_date && (
                                                <div className={`text-[10px] font-bold ${new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {task.total_time !== undefined && task.total_time > 0 && (
                                        <div className="mt-2 text-[10px] text-indigo-500 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(task.total_time)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-3 h-3" />
                                Add Task
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
