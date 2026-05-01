'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ModuleGuardProps {
    moduleName: string;
    children: React.ReactNode;
}

export default function ModuleGuard({ moduleName, children }: ModuleGuardProps) {
    const { org, user, activeStatus } = useAuth();
    const searchParams = useSearchParams();
    const taskIdParam = searchParams?.get('taskId');
    
    // 1. Organization level check (Is the module enabled for the whole workspace?)
    const isModuleEnabledForOrg = org?.enabled_modules?.includes(moduleName);

    const userRole = (user?.role || 'user').toLowerCase();
    
    // Admins always have access to everything that is enabled for the org
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    // Custom roles follow the mapping in org.role_permissions
    // FALLBACK: If permissions are not defined for this role, OR if it's the basic 'tasks' module, grant access.
    const rolePermissions = org?.role_permissions?.[userRole] || [];
    
    // Contextual Access: If the user has an active task assigned and is accessing via that task
    const isWorkingOnTask = taskIdParam && activeStatus?.active_task_id === taskIdParam;
    
    const hasRolePermission = isAdmin || (moduleName === 'tasks') || rolePermissions.includes(moduleName) || isWorkingOnTask;

    // Final access decision
    const isAccessGranted = isModuleEnabledForOrg && hasRolePermission;
    
    // Mapping internal module names to human-readable labels
    const moduleLabels: Record<string, string> = {
        monitoring: 'Employee Monitoring & Screenshots',
        tasks: 'Direct Task Management',
        workflow: 'Editorial Workflow System',
        library: 'Digital Content Library',
        standards: 'Curriculum Standards',
        lesson_plans: 'Lesson Planning Tools',
        assessments: 'Assessment & Examination Tools',
        rights: 'Rights & Content Integrity'
    };

    if (isAccessGranted) {
        return <>{children}</>;
    }

    if (!isModuleEnabledForOrg) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8 animate-in fade-in duration-700">
                <div className="max-w-md w-full text-center space-y-8">
                    {/* Premium/Locked Icon */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-xl shadow-indigo-100 rotate-6 transition-transform hover:rotate-0">
                            <Lock className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg animate-bounce duration-1000">
                            <Sparkles className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Premium Feature
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            The <span className="font-extrabold text-indigo-600 italic">"{moduleLabels[moduleName] || moduleName}"</span> module is not included in your organization's current plan.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">How to access?</p>
                        <p className="text-xs text-slate-600 font-bold">
                            Please contact your Super Admin to enable this module for your organization.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link 
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasRolePermission) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8 animate-in fade-in duration-700">
                <div className="max-w-md w-full text-center space-y-8">
                    {/* Access Denied Icon */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-xl shadow-rose-100 -rotate-6 transition-transform hover:rotate-0">
                            <Lock className="w-10 h-10 text-rose-600" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Access Denied
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Your account (<span className="font-extrabold text-rose-600 uppercase italic">{userRole.replace('_', ' ')}</span>) does not have the required permissions to access the <span className="font-extrabold text-slate-900 italic">"{moduleLabels[moduleName] || moduleName}"</span> module.
                        </p>
                    </div>

                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-dashed border-rose-200">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Requirement</p>
                        <p className="text-xs text-rose-900 font-bold">
                            Please contact your Organization Admin to upgrade your role permissions.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link 
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null; // Should not reach here if logic is correct
}
