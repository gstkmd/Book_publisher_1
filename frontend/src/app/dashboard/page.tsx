'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.full_name || user.email}!</h1>
                    <p className="mt-2 text-gray-600">Role: {user.role}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Content Library */}
                    <Link href="/dashboard/library" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📚 Content Library</h2>
                        <p className="text-gray-600">Browse and manage educational content with version history</p>
                    </Link>

                    {/* Collaboration Hub - NEW */}
                    <Link href="/dashboard/collaboration" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-blue-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🤝 Collaboration</h2>
                        <p className="text-gray-600">Comments, Tasks, and Workflow in one place</p>
                    </Link>

                    {/* Standards */}
                    <Link href="/dashboard/standards" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📋 Standards</h2>
                        <p className="text-gray-600">Manage curriculum standards and frameworks</p>
                    </Link>

                    {/* Lesson Plans */}
                    <Link href="/dashboard/lesson-plans" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📝 Lesson Plans</h2>
                        <p className="text-gray-600">Create and manage lesson plans</p>
                    </Link>

                    {/* Assessments */}
                    <Link href="/dashboard/assessments" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">✅ Assessments</h2>
                        <p className="text-gray-600">Create and manage assessments</p>
                    </Link>

                    {/* Workflow */}
                    <Link href="/dashboard/workflow" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔄 Workflow</h2>
                        <p className="text-gray-600">Manage content workflow and collaboration</p>
                    </Link>

                    {/* Tasks */}
                    <Link href="/dashboard/tasks" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📌 Tasks</h2>
                        <p className="text-gray-600">View and manage your tasks</p>
                    </Link>

                    {/* Rights Management */}
                    <Link href="/dashboard/rights" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">⚖️ Rights</h2>
                        <p className="text-gray-600">Manage content rights and permissions</p>
                    </Link>

                    {/* Settings */}
                    <Link href="/dashboard/settings" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">⚙️ Settings</h2>
                        <p className="text-gray-600">Configure your account and preferences</p>
                    </Link>

                    {/* Monitoring - NEW */}
                    <Link href="/dashboard/monitoring" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-emerald-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🛡️ Monitoring</h2>
                        <p className="text-gray-600">Employee activity, productivity, and live tracking</p>
                    </Link>

                    {/* Admin (only for admins) */}
                    {user.role === 'admin' && (
                        <Link href="/dashboard/admin" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-purple-200">
                            <h2 className="text-xl font-semibold text-purple-900 mb-2">👑 Admin</h2>
                            <p className="text-purple-700">System administration and user management</p>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
