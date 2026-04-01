import React from 'react';
import Link from 'next/link';

interface Agent {
    id: string;
    computer_name: string;
    email: string;
    last_seen: string;
    screenshot_count: number;
}

interface AgentListProps {
    agents: Agent[];
}

const formatDateTimeIST = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
        let dStr = dateString;
        if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.match(/-\d{2}:\d{2}$/)) {
            dStr += 'Z';
        }
        const d = new Date(dStr);
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(d);
    } catch {
        return '-';
    }
};

export function AgentList({ agents }: AgentListProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Active Team Members</h2>
                <span className="text-sm text-gray-500">{agents.length} members total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Computer Name</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Last Seen</th>
                            <th className="px-6 py-3">Screenshots</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {agents.map((agent) => (
                            <tr
                                key={agent.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/dashboard/monitoring/${agent.id}`}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">{agent.computer_name}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {(agent as any).full_name || agent.email}
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {agent.last_seen ? formatDateTimeIST(agent.last_seen) : 'Never'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {agent.screenshot_count || 0} captured
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <Link
                                        href={`/dashboard/monitoring/${agent.id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        View Details →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {agents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No active team members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
