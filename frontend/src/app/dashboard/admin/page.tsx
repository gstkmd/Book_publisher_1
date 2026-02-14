'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MemberList } from '@/components/MemberList';

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (token) fetchStats();
    }, [token]);

    const fetchStats = async () => {
        try {
            const data = await api.get('/organizations/stats', token!);
            setStats(data);
        } catch (err) { console.error(err); }
    };

    if (!stats) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    const storagePercent = (stats.storage_used_mb / stats.plan_limit_mb) * 100;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 line-clamp-1">Organization Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your team and track platform usage.</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Members Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Team Members</div>
                    <div className="text-4xl font-black text-blue-600">{stats.members}</div>
                </div>

                {/* Content Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Content Assets</div>
                    <div className="text-4xl font-black text-green-600">{stats.content_items}</div>
                </div>

                {/* Storage Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Cloud Storage</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-purple-600">{stats.storage_used_mb}</span>
                        <span className="text-gray-400 font-medium">MB</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* User Management */}
                    <MemberList />
                </div>

                <div className="space-y-8">
                    {/* Storage Analytics */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Storage Utilization</h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                        {storagePercent.toFixed(1)}% Capacity
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-purple-600">
                                        {stats.storage_used_mb} / {stats.plan_limit_mb} MB
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-purple-100">
                                <div
                                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-500"
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 italic">Plan: Free Tier (Next upgrade at 90% usage)</p>
                        </div>
                    </div>

                    {/* Quick Settings Placeholder */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Organization Settings</h3>
                        <div className="space-y-3 opacity-50 pointer-events-none">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
