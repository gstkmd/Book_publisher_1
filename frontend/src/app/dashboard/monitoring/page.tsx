'use client';

import { useState, useEffect } from 'react';
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

export default function MonitoringDashboardPage() {
    const { token, user } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryData, agentsData, screenshotsData] = await Promise.all([
                api.get('/monitoring/dashboard/summary', token || undefined),
                api.get('/monitoring/dashboard/agents', token || undefined),
                api.get('/monitoring/dashboard/screenshots?limit=8', token || undefined)
            ]);
            setSummary(summaryData);
            setAgents(agentsData);
            setScreenshots(screenshotsData);
        } catch (err: any) {
            console.error('Failed to fetch monitoring data:', err);
            setError('Could not load monitoring data. Please ensure the backend is running.');
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
                />
                <MetricCard
                    title="Screenshots"
                    value={summary?.screenshots_today || 0}
                    icon="📸"
                    color="green"
                    description="Last 24h"
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
                <div className="lg:col-span-2">
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

            {/* Screenshot Gallery */}
            <ScreenshotGallery screenshots={screenshots} apiUrl={API_BASE.replace('/api/v1', '/api/v1')} />
        </div>
    );
}
