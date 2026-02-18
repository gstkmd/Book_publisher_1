'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ScreenshotGallery } from '@/components/monitoring/ScreenshotGallery';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AgentDetailPage() {
    const { agentId } = useParams();
    const { token } = useAuth();
    const router = useRouter();
    const [activity, setActivity] = useState<any>(null);
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (token && agentId) {
            fetchAgentData();
        }
    }, [token, agentId, selectedDate]);

    const fetchAgentData = async () => {
        setIsLoading(true);
        try {
            const [activityData, screenshotsData] = await Promise.all([
                api.get(`/monitoring/dashboard/agent/${agentId}/activity?date=${selectedDate}`, token || undefined),
                api.get(`/monitoring/dashboard/screenshots?agent_id=${agentId}&limit=50`, token || undefined)
            ]);
            setActivity(activityData);
            setScreenshots(screenshotsData);
        } catch (err) {
            console.error('Failed to fetch agent details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        ⬅️
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Agent Activity Detail</h1>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <span className="text-sm font-bold text-gray-500 ml-2">Select Date:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-0 focus:ring-0 text-sm font-bold text-indigo-600 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* App Usage Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Application Usage</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">App Name</th>
                                    <th className="px-6 py-3">Duration</th>
                                    <th className="px-6 py-3">Clicks/Keys</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activity?.app_usage?.map((app: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-sm text-gray-900">{app.app_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {Math.round(app.total_seconds / 60)} mins
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            🖱️ {app.total_clicks} / ⌨️ {app.total_keys}
                                        </td>
                                    </tr>
                                ))}
                                {(!activity?.app_usage || activity.app_usage.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No activity recorded for this date ({selectedDate}).</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Hourly Activity (Simple list for now, could be a chart) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Hourly Activity (Seconds)</h2>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {activity?.hourly_activity?.map((h: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-xs font-mono text-gray-500 w-8">{h.hour}:00</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${Math.min(100, (h.active_seconds / 3600) * 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-600">{Math.round(h.active_seconds / 60)}m</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Screenshots */}
            <ScreenshotGallery screenshots={screenshots} apiUrl={API_BASE.replace('/api/v1', '/api/v1')} />
        </div>
    );
}
