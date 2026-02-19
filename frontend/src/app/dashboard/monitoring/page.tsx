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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const fetchData = async () => {
        const now = Date.now();

        // 1. Check module-level lock (shared in this tab's memory)
        // 2. Check localStorage lock (shared across ALL tabs for this origin)
        const lastGlobalFetch = parseInt(localStorage.getItem('last_monitoring_fetch') || '0');

        if (now - lastGlobalFetch < 2000) {
            console.log(`[${globalInstanceId}] 🔄 Fetch blocked (Debounce: ${now - lastGlobalFetch}ms ago)`);
            return;
        }

        localStorage.setItem('last_monitoring_fetch', now.toString());
        setIsLoading(true);
        console.log(`[${globalInstanceId}] 📡 Fetching monitoring data...`);

        try {
            const [summaryData, agentsData, screenshotsData] = await Promise.all([
                api.get('/monitoring/dashboard/summary', token || undefined),
                api.get('/monitoring/dashboard/agents', token || undefined),
                api.get('/monitoring/dashboard/screenshots?limit=8', token || undefined)
            ]);
            setSummary(summaryData);
            setAgents(agentsData);
            setScreenshots(screenshotsData);
            console.log(`[${globalInstanceId}] ✅ Data received`);
        } catch (err: any) {
            console.error(`[${globalInstanceId}] ❌ Fetch failed:`, err);
            setError('Could not load monitoring data. Please ensure the backend is running.');
        } finally {
            setIsLoading(false);
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

            {/* Screenshot Gallery */}
            <div ref={screenshotsSectionRef}>
                <ScreenshotGallery screenshots={screenshots} apiUrl={API_BASE.replace('/api/v1', '/api/v1')} />
            </div>
        </div>
    );
}
