'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

    if (!stats) return <div className="p-8">Loading analytics...</div>;

    const storagePercent = (stats.storage_used_mb / stats.plan_limit_mb) * 100;

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Organization Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Members Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-gray-500 mb-1">Total Members</div>
                    <div className="text-3xl font-bold">{stats.members}</div>
                </div>

                {/* Content Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="text-gray-500 mb-1">Content Items</div>
                    <div className="text-3xl font-bold">{stats.content_items}</div>
                </div>

                {/* Storage Card */}
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="text-gray-500 mb-1">Storage Used</div>
                    <div className="text-3xl font-bold">{stats.storage_used_mb} MB</div>
                    <div className="text-xs text-gray-400">of {stats.plan_limit_mb} MB Plan Limit</div>
                </div>
            </div>

            {/* Storage Bar */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="font-bold mb-4">Storage Usage</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                        className="bg-purple-600 h-4 rounded-full"
                        style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    ></div>
                </div>
                <div className="mt-2 text-right text-sm text-gray-600">{storagePercent.toFixed(1)}% Used</div>
            </div>

            {/* Recent Activity Table (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4">Recent Activity</h3>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="pb-2">User</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="py-2">Alice Smith</td>
                            <td>Updated <b>Chapter 1</b></td>
                            <td className="text-gray-500">2 mins ago</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-2">Bob Jones</td>
                            <td>Created task <b>Review Draft</b></td>
                            <td className="text-gray-500">1 hour ago</td>
                        </tr>
                        <tr>
                            <td className="py-2">Admin</td>
                            <td>Updated Organization Settings</td>
                            <td className="text-gray-500">3 hours ago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
