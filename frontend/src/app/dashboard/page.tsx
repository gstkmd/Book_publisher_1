'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
    LayoutDashboard, Library, CheckSquare, GitBranch, 
    ClipboardList, FileEdit, Scale, Activity, 
    HelpCircle, Settings, Shield, Lock, Users, MessageSquare
} from 'lucide-react';

const DASHBOARD_ITEMS = [
    { 
        name: 'Content Library', 
        href: '/dashboard/library', 
        icon: Library, 
        desc: 'Browse and manage educational content with version history',
        featureId: 'library',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    { 
        name: 'Collaboration', 
        href: '/dashboard/collaboration', 
        icon: MessageSquare, 
        desc: 'Comments, Tasks, and Workflow in one place',
        featureId: 'collaboration',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50'
    },
    { 
        name: 'Standards', 
        href: '/dashboard/standards', 
        icon: ClipboardList, 
        desc: 'Manage curriculum standards and frameworks',
        featureId: 'standards',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50'
    },
    { 
        name: 'Lesson Plans', 
        href: '/dashboard/lesson-plans', 
        icon: FileEdit, 
        desc: 'Create and manage lesson plans',
        featureId: 'lesson_plans',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    },
    { 
        name: 'Assessments', 
        href: '/dashboard/assessments', 
        icon: CheckSquare, 
        desc: 'Create and manage assessments',
        featureId: 'assessments',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
    },
    { 
        name: 'Workflow', 
        href: '/dashboard/workflow', 
        icon: GitBranch, 
        desc: 'Manage content workflow and collaboration',
        featureId: 'workflow',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
    },
    { 
        name: 'Tasks', 
        href: '/dashboard/tasks', 
        icon: CheckSquare, 
        desc: 'View and manage your tasks',
        featureId: 'tasks',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50'
    },
    { 
        name: 'Rights', 
        href: '/dashboard/rights', 
        icon: Scale, 
        desc: 'Manage content rights and permissions',
        featureId: 'rights',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100'
    },
    { 
        name: 'Settings', 
        href: '/dashboard/settings', 
        icon: Settings, 
        desc: 'Configure your account and preferences',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100'
    },
    { 
        name: 'Monitoring', 
        href: '/dashboard/monitoring', 
        icon: Activity, 
        desc: 'Employee activity, productivity, and live tracking',
        featureId: 'monitoring',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        requiredRoles: ['admin', 'editor_in_chief', 'reviewer', 'super_admin']
    }
];

export default function DashboardPage() {
    const { user, org, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {user.full_name || 'User'}!</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role:</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg border border-indigo-100/50">
                        {user.role?.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DASHBOARD_ITEMS.map((item, idx) => {
                    const isEnabled = !item.featureId || org?.enabled_modules?.includes(item.featureId);
                    const hasRole = !item.requiredRoles || (user?.role && item.requiredRoles.includes(user.role.toLowerCase()));
                    const shouldHide = (!isEnabled && org?.hide_disabled_features) || !hasRole;

                    if (shouldHide) return null;

                    const isLocked = !isEnabled;
                    const Icon = item.icon;

                    return (
                        <div key={item.name} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {isLocked ? (
                                <div className="group relative p-8 bg-white border border-slate-100 rounded-[2rem] opacity-50 cursor-not-allowed overflow-hidden">
                                    <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center ${item.color} mb-6`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight flex items-center gap-2">
                                        {item.name}
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    </h2>
                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                    <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Locked</div>
                                </div>
                            ) : (
                                <Link 
                                    href={item.href}
                                    className="group block p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 hover:-translate-y-1"
                                >
                                    <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center ${item.color} mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {item.name}
                                    </h2>
                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                </Link>
                            )}
                        </div>
                    );
                })}

                {/* Admin Card */}
                {(user.role === 'admin' || user.role === 'super_admin') && (
                    <Link href="/dashboard/admin" className="group block p-8 bg-indigo-600 rounded-[2rem] hover:bg-slate-900 transition-all duration-500 hover:-translate-y-1 shadow-xl shadow-indigo-200">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Admin Console</h2>
                        <p className="text-indigo-100 text-sm leading-relaxed">System administration, user management, and organization settings.</p>
                    </Link>
                )}
            </div>
        </div>
    );
}
