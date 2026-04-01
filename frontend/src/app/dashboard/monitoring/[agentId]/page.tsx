'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ScreenshotGallery } from '@/components/monitoring/ScreenshotGallery';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

export default function AgentDetailPage() {
    const { agentId } = useParams();
    const { token } = useAuth();
    const router = useRouter();
    const [activity, setActivity] = useState<any>(null);
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Initialize with local date instead of UTC date to avoid day-offset issues in IST
    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [selectedScreenshot, setSelectedScreenshot] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'screenshots'>('activity');

    useEffect(() => {
        if (token && agentId) {
            fetchAgentData();
        }
    }, [token, agentId, selectedDate]);

    const fetchAgentData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [activityData, screenshotsData] = await Promise.all([
                api.get(`/monitoring/dashboard/agent/${agentId}/activity?date=${selectedDate}`, token || undefined),
                api.get(`/monitoring/dashboard/screenshots?agent_id=${agentId}&date=${selectedDate}&limit=50`, token || undefined)
            ]);
            setActivity(activityData);
            setScreenshots(screenshotsData);
            if (!activityData?.summary) {
                console.warn('Agent summary is missing in backend response');
            }
        } catch (err: any) {
            console.error('Failed to fetch agent details:', err);
            setError(err.message || 'Failed to fetch agent details');
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

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Agent Details</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={() => fetchAgentData()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                    <button 
                        onClick={() => router.back()}
                        className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
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
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Team Activity Detail</h1>
                    {activity?.summary && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-semibold text-indigo-600">
                                {activity.summary.user_full_name}
                            </span>
                        </div>
                    )}
                </div>
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

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title={activity?.summary?.user_full_name || 'Member Status'}
                    value={activity?.summary?.is_online ? 'Online' : 'Offline'}
                    icon="👤"
                    color={activity?.summary?.is_online ? 'green' : 'orange'}
                    description={activity?.summary?.is_online ? 'Online now' : `Last: ${formatDateTimeIST(activity?.summary?.last_seen).split(',')[1] || '-'}`}
                />
                <MetricCard
                    title="Screenshots"
                    value={activity?.summary?.screenshot_count || 0}
                    icon="📸"
                    color="green"
                    description="For selected date"
                />
                <MetricCard
                    title="Active Minutes"
                    value={activity?.summary?.active_minutes || 0}
                    icon="⏱️"
                    color="purple"
                    description="Total time"
                />
                <MetricCard
                    title="Productivity Score"
                    value={`${activity?.summary?.productivity_score || 0}%`}
                    icon="📈"
                    color="orange"
                    description="Avg. efficiency"
                />
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-gray-100 mb-6">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'activity'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Recent Activity
                </button>
                <button
                    onClick={() => setActiveTab('screenshots')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                        activeTab === 'screenshots'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Screenshots
                </button>
            </div>

            {activeTab === 'activity' ? (
                <>
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activity?.app_usage?.map((app: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-sm text-gray-900">{app.app_name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {Math.round(app.total_seconds / 60)} mins
                                                </td>
                                            </tr>
                                        ))}
                                        {(!activity?.app_usage || activity.app_usage.length === 0) && (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-8 text-center text-gray-500">No activity recorded for this date ({selectedDate}).</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Hourly Activity */}
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

                    {/* Raw Recent Activity Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                        <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
                            <h3 className="font-bold text-gray-900">Recent Activity Logs</h3>
                            <span className="text-sm text-gray-500">
                                {activity?.raw_logs ? activity.raw_logs.length : 0} logs shown
                            </span>
                        </div>
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">App / Window</th>
                                        <th className="px-6 py-4">URL / Path</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {activity?.raw_logs?.map((log: any, idx: number) => (
                                        <tr key={log.id || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {formatDateTimeIST(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{log.app_name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[300px]">{log.window_title}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600">
                                                <span className="truncate max-w-[200px] inline-block" title={log.web_url || log.file_path}>
                                                    {log.web_url || log.file_path || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.activity_type === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {log.activity_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!activity?.raw_logs || activity.raw_logs.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                                No recent activity logs found for this date.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="mt-8">
                    <ScreenshotGallery 
                        screenshots={screenshots} 
                        apiUrl={API_BASE} 
                        onScreenshotClick={(shot) => setSelectedScreenshot(shot)}
                    />
                </div>
            )}

            {/* Image Preview Modal */}
            <Modal 
                isOpen={!!selectedScreenshot} 
                onClose={() => setSelectedScreenshot(null)}
                title={`Screenshot Preview - ${selectedScreenshot?.computer_name}`}
            >
                {selectedScreenshot && (
                    <div className="flex flex-col items-center gap-4">
                        <img 
                            src={`${API_BASE}/monitoring/dashboard/screenshot/${selectedScreenshot.id}`} 
                            alt="Full Size Screenshot"
                            className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
                        />
                        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                            Captured at: {formatDateTimeIST(selectedScreenshot.timestamp)}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
