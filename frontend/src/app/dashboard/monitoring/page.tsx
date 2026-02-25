'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { AgentList } from '@/components/monitoring/AgentList';
import { ScreenshotGallery } from '@/components/monitoring/ScreenshotGallery';
import Link from 'next/link';

// Helper to get the API base URL (without version suffix if needed, but here we use it relative to our api helper)
// The api helper uses process.env.NEXT_PUBLIC_API_URL or 'http://localhost:8000/api/v1'
// Our monitoring routes are under /monitoring
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Global variables to track the *first* mount in this JS environment
let globalInstanceId = typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'server';
let mountCount = 0;

export default function MonitoringDashboardPage() {
    const { token, user } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [teamActivities, setTeamActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    const agentsSectionRef = useRef<HTMLDivElement>(null);
    const screenshotsSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mountCount++;
        console.log(`[${globalInstanceId}] 🏗️ MonitoringDashboardPage mounted (Mount #${mountCount})`);
        if (token) {
            console.log(`[${globalInstanceId}] 🚀 Initial fetch trigger (token present)`);
            fetchData();
        }
    }, [token]);

    const isFetchingRef = useRef(false);

    const fetchData = async () => {
        // 1. Check local synchronous guard (prevents same-render-cycle double fires)
        if (isFetchingRef.current) return;

        // 2. Add a small random jitter (0-200ms) to break symmetry between multiple tabs
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

        const now = Date.now();

        // 3. Check localStorage lock (shared across ALL tabs/instances)
        const lastGlobalFetch = parseInt(localStorage.getItem('last_monitoring_fetch') || '0');

        if (now - lastGlobalFetch < 2000) {
            console.log(`[${globalInstanceId}] 🔄 Fetch blocked (Debounce: ${now - lastGlobalFetch}ms ago)`);
            return;
        }

        isFetchingRef.current = true;
        localStorage.setItem('last_monitoring_fetch', now.toString());
        setIsLoading(true);
        console.log(`[${globalInstanceId}] 📡 Fetching monitoring data...`);

        try {
            const [summaryData, agentsData, screenshotsData, teamActivitiesData, usersData] = await Promise.all([
                api.get('/monitoring/dashboard/summary', token || undefined),
                api.get('/monitoring/dashboard/agents', token || undefined),
                api.get('/monitoring/dashboard/screenshots?limit=8', token || undefined),
                api.get('/team-monitoring/team-activity', token || undefined),
                api.get('/organizations/members', token || undefined)
            ]);
            setSummary(summaryData);
            setAgents(agentsData);
            setScreenshots(screenshotsData);
            setTeamActivities(teamActivitiesData || []);
            setUsers(usersData || []);
            console.log(`[${globalInstanceId}] ✅ Data received (Synchronized)`);
        } catch (err: any) {
            console.error(`[${globalInstanceId}] ❌ Fetch failed:`, err);
            setError('Could not load monitoring data. Please ensure the backend is running.');
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!token) return;

        console.log(`[${globalInstanceId}] ⏱️ Setting up monitoring polling (30s)`);
        const intervalId = setInterval(() => {
            console.log(`[${globalInstanceId}] 🔔 Polling trigger...`);
            fetchData();
        }, 30000); // Poll every 30 seconds

        return () => {
            console.log(`[${globalInstanceId}] 🛑 Clearing monitoring polling`);
            clearInterval(intervalId);
        };
    }, [token]);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
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
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Employee Monitoring</h1>
                    <p className="text-gray-500 mt-2 font-medium">Real-time overview of workforce activity and productivity.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    title="Refresh Data"
                >
                    🔄
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Agents Today"
                    value={summary?.active_agents || 0}
                    icon="👥"
                    color="blue"
                    description="Online now"
                    onClick={() => scrollToSection(agentsSectionRef)}
                />
                <MetricCard
                    title="Screenshots"
                    value={summary?.screenshots_today || 0}
                    icon="📸"
                    color="green"
                    description="Last 24h"
                    onClick={() => scrollToSection(screenshotsSectionRef)}
                />
                <MetricCard
                    title="Active Minutes"
                    value={summary?.total_active_minutes || 0}
                    icon="⏱️"
                    color="purple"
                    description="Total time"
                />
                <MetricCard
                    title="Productivity Score"
                    value={`${summary?.productivity_score || 0}%`}
                    icon="📈"
                    color="orange"
                    description="Avg. efficiency"
                />
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Agent List - Takes 2/3 space */}
                <div className="lg:col-span-2" ref={agentsSectionRef}>
                    <AgentList agents={agents} />
                </div>

                {/* Side Info/Quick Stats - Takes 1/3 space */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Helpful Tip</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Click on an agent to see detailed app usage, hourly activity trends, and their full screenshot gallery.
                        </p>
                        <Link
                            href="/dashboard/workflow"
                            className="inline-block mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                            View Workflow Stats
                        </Link>
                    </div>
                </div>
            </div>

            {/* Team Activity Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900">Recent Team Activity</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="user-filter" className="text-sm font-medium text-gray-600">Filter by User:</label>
                            <select
                                id="user-filter"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Users</option>
                                {users.map(u => {
                                    const userId = u.id || u._id;
                                    return (
                                        <option key={userId} value={userId}>{u.full_name}</option>
                                    );
                                })}
                            </select>
                        </div>
                        <span className="text-sm text-gray-500">
                            {teamActivities.filter(a => {
                                if (selectedUserId === 'all') return true;
                                const activityUserId = a.user?.id || a.user?._id || a.user;
                                return String(activityUserId) === String(selectedUserId);
                            }).length} logs shown
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">App / Window</th>
                                <th className="px-6 py-4">URL / Path</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {teamActivities
                                .filter(activity => {
                                    if (selectedUserId === 'all') return true;
                                    const activityUserId = activity.user?.id || activity.user?._id || activity.user;
                                    return String(activityUserId) === String(selectedUserId);
                                })
                                .map((activity, idx) => (
                                    <tr key={activity.id || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {activity.user?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{activity.user?.full_name || (typeof activity.user === 'string' ? 'User ID: ' + activity.user : 'Unknown User')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{activity.app_name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{activity.window_title}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-600">
                                            <span className="truncate max-w-[150px] inline-block" title={activity.web_url || activity.file_path}>
                                                {activity.web_url || activity.file_path || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.activity_type === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {activity.activity_type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            {teamActivities.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No team activity logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Screenshot Gallery */}
            <div ref={screenshotsSectionRef}>
                <ScreenshotGallery screenshots={screenshots} apiUrl={API_BASE.replace('/api/v1', '/api/v1')} />
            </div>
        </div>
    );
}
