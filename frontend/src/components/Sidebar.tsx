'use client';

import React, { useState, useEffect } from 'react';
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
    Scale
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const { user, logout, token } = useAuth();
    const [orgName, setOrgName] = useState<string>('');

    useEffect(() => {
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/organizations/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data?.name) setOrgName(data.name); })
                .catch(() => { });
        }
    }, [token]);

    const displayName = orgName || user?.full_name?.split(' ')[0] || 'My Org';

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Library', href: '/dashboard/library', icon: Library },
        { name: 'Collaboration', href: '/dashboard/collaboration', icon: Users },
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch },
        { name: 'Standards', href: '/dashboard/standards', icon: ClipboardList },
        { name: 'Lesson Plans', href: '/dashboard/lesson-plans', icon: FileEdit },
        { name: 'Assessments', href: '/dashboard/assessments', icon: CheckSquare },
        { name: 'Rights', href: '/dashboard/rights', icon: Scale },
        { name: 'Monitoring', href: '/dashboard/monitoring', icon: Activity },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ name: 'Admin', href: '/dashboard/admin', icon: Shield });
    }

    const toggleSidebar = () => setIsOpen(!isOpen);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <>
            {/* Mobile Header / Hamburger */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
                <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {displayName}
                </span>
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
                        <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate">
                            {displayName}
                        </span>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className={`p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                    ${isCollapsed ? 'justify-center lg:px-0 lg:w-12 lg:mx-auto' : ''}
                                `}
                                title={isCollapsed ? item.name : ''}
                            >
                                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300
                                    ${isCollapsed ? 'lg:hidden opacity-0 w-0' : 'opacity-100 w-auto'}
                                `}>
                                    {item.name}
                                </span>
                                {isActive && !isCollapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 mt-auto border-t border-slate-50 space-y-2">
                    <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-50/50 transition-all ${isCollapsed ? 'justify-center p-1' : ''}`}>
                        <UserAvatar name={user?.full_name || ''} size={isCollapsed ? "xs" : "sm"} className="ring-2 ring-white shadow-sm" />
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{user?.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{user?.role}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => logout()}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all group font-bold text-[13px] uppercase tracking-wider
                            ${isCollapsed ? 'justify-center p-0 lg:w-12 lg:mx-auto' : ''}
                        `}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
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
