'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Library,
    Users,
    ClipboardList,
    FileEdit,
    CheckSquare,
    GitBranch,
    PanelLeftClose,
    PanelLeft,
    Settings,
    Shield,
    History,
    LogOut,
    Menu,
    X,
    Activity,
    Scale,
    ChevronDown,
    Globe,
    Lock,
    XCircle
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, org, logout, token, exitOrganizationContext } = useAuth();

    const displayName = org?.name || user?.full_name?.split(' ')[0] || 'My Org';

    const mainItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Library', href: '/dashboard/library', icon: Library, featureId: 'library' },
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, featureId: 'tasks' },
        { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch, featureId: 'workflow' },
        { name: 'Standards', href: '/dashboard/standards', icon: ClipboardList, featureId: 'standards' },
        { name: 'Lesson Plans', href: '/dashboard/lesson-plans', icon: FileEdit, featureId: 'lesson_plans' },
        { name: 'Assessments', href: '/dashboard/assessments', icon: CheckSquare, featureId: 'assessments' },
        { name: 'Rights', href: '/dashboard/rights', icon: Scale, featureId: 'rights' },
        { name: 'Monitoring', href: '/dashboard/monitoring', icon: Activity, featureId: 'monitoring' },
    ];

    const systemItems = [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <>
            {/* Mobile Header / Hamburger */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
                <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Workspace</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate leading-none block pb-1">
                            {displayName}
                        </span>
                        {user?.role === 'super_admin' && org && (
                            <button
                                onClick={exitOrganizationContext}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-all"
                                title="Exit Workspace context"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                `}
            >
                {/* Desktop Logo Area */}
                <div className="hidden lg:flex h-20 items-center justify-between px-6 border-b border-slate-50">
                    {!isCollapsed && (
                        <div className="flex flex-col justify-center min-w-0 pr-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Workspace</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate leading-none pb-1 block">
                                    {displayName}
                                </span>
                                {user?.role === 'super_admin' && org && (
                                    <button
                                        onClick={exitOrganizationContext}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-all hover:bg-slate-50 rounded-md"
                                        title="Exit Workspace context"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className={`p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                    {/* Main Items */}
                    <div className="space-y-1">
                        {[...mainItems]
                            .sort((a, b) => {
                                const aEnabled = !a.featureId || org?.enabled_modules?.includes(a.featureId);
                                const bEnabled = !b.featureId || org?.enabled_modules?.includes(b.featureId);
                                if (aEnabled === bEnabled) return 0;
                                return aEnabled ? -1 : 1;
                            })
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                const isEnabled = !item.featureId || org?.enabled_modules?.includes(item.featureId);
                                const shouldHide = !isEnabled && org?.hide_disabled_features;

                            if (shouldHide) return null;

                            const isLocked = !isEnabled;
                            
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
                                            : isLocked 
                                                ? 'text-slate-300 hover:bg-slate-50/50'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                    ${isCollapsed ? 'justify-center lg:px-0 lg:w-12 lg:mx-auto' : ''}
                                `}
                                    title={isCollapsed ? item.name : ''}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 
                                        ${isActive ? 'text-indigo-600' : isLocked ? 'text-slate-200' : 'text-slate-400'}`} 
                                    />
                                    <span className={`text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                                    ${isCollapsed ? 'lg:hidden opacity-0 w-0' : 'opacity-100 w-auto'}
                                    ${isLocked ? 'text-slate-300 italic font-medium' : ''}
                                `}>
                                        {item.name}
                                    </span>
                                    {isLocked && !isCollapsed && (
                                        <Lock className="ml-auto w-3 h-3 text-slate-200" />
                                    )}
                                    {isActive && !isCollapsed && !isLocked && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Admin Section (admin or super_admin) */}
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super_admin') && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setAdminOpen(!adminOpen)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    text-slate-500 hover:bg-slate-50 hover:text-slate-900
                                    ${isCollapsed ? 'justify-center lg:px-0 lg:w-12 lg:mx-auto' : ''}
                                `}
                                title={isCollapsed ? 'Admin' : ''}
                            >
                                <Shield className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${adminOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                                {!isCollapsed && (
                                    <>
                                        <span className="text-[13px] font-bold uppercase tracking-wider">
                                            Admin
                                        </span>
                                        <ChevronDown className={`ml-auto w-4 h-4 transition-transform duration-200 ${adminOpen ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`} />
                                    </>
                                )}
                            </button>
 
                            {/* Admin Sub-items */}
                            {adminOpen && !isCollapsed && (
                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-indigo-100 pl-3">
                                    {[
                                        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
                                        { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield },
                                    ].map(item => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link key={item.href} href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all
                                                    ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                                `}
                                            >
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                {item.name}
                                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Super Admin Section (super_admin role only) */}
                    {(user?.role?.toLowerCase() === 'super_admin') && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <Link
                                href="/dashboard/superadmin"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${pathname === '/dashboard/superadmin'
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                ${isCollapsed ? 'justify-center lg:px-0 lg:w-12 lg:mx-auto' : ''}
                            `}
                                title={isCollapsed ? 'Super Admin' : ''}
                            >
                                <Globe className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${pathname === '/dashboard/superadmin' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                                ${isCollapsed ? 'lg:hidden opacity-0 w-0' : 'opacity-100 w-auto'}
                            `}>
                                    Super Admin
                                </span>
                                {pathname === '/dashboard/superadmin' && !isCollapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                )}
                            </Link>
                        </div>
                    )}
                </nav>

                {/* User Avatar Section */}
                <div className="p-4 mt-auto border-t border-slate-50 relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 transition-all ${isCollapsed ? 'justify-center p-1' : ''}`}
                    >
                        <UserAvatar name={user?.full_name || ''} size={isCollapsed ? "xs" : "sm"} className="ring-2 ring-white shadow-sm" />
                        {!isCollapsed && (
                            <div className="min-w-0 text-left flex-1">
                                <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight leading-tight">{user?.full_name}</p>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <p className="text-[9px] font-bold text-slate-400 truncate tracking-wide">{user?.email}</p>
                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase self-start leading-none">{user?.role}</span>
                                </div>
                            </div>
                        )}
                    </button>

                    {/* User Popup Menu */}
                    {userMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-150">
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-xs font-black text-slate-900 truncate">{user?.full_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { setUserMenuOpen(false); logout(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 transition-all text-[13px] font-bold uppercase tracking-wider"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* Main Content Spacer for Desktop */}
            <div className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0
                ${isCollapsed ? 'w-20' : 'w-64'}
            `} />

            {/* Mobile Top Padding */}
            <div className="lg:hidden h-16 shrink-0" />
        </>
    );
};
