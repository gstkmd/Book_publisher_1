import React from 'react';
import Link from 'next/link';

interface Agent {
    id: string;
    computer_name: string;
    os_version: string;
    last_seen: string;
    screenshot_count: number;
}

interface AgentListProps {
    agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Active Agents</h2>
                <span className="text-sm text-gray-500">{agents.length} agents total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Computer Name</th>
                            <th className="px-6 py-3">OS Version</th>
                            <th className="px-6 py-3">Last Seen</th>
                            <th className="px-6 py-3">Screenshots</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {agents.map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{agent.computer_name}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">{agent.os_version}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {(() => {
                                        try {
                                            let dateStr = agent.last_seen;
                                            if (dateStr && !dateStr.includes('Z')) {
                                                // If ' ' instead of 'T', fix it
                                <td className="px-6 py-4 text-gray-900 text-sm whitespace-nowrap">
                                    {agent.last_seen ? new Date(agent.last_seen).toLocaleString() : 'Never'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {agent.screenshot_count || 0} captured
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
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
                                    No active agents found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
