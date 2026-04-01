'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { 
    Globe, 
    Users, 
    Settings, 
    Shield, 
    CheckCircle, 
    XCircle, 
    MoreHorizontal, 
    RefreshCw, 
    Search,
    Trash2,
    Save,
    Key,
    Clock,
    Database,
    Package
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    plan: string;
    is_active: boolean;
    enabled_modules: string[];
    monitoring_retention_days: number;
    screenshot_retention_days: number;
    sync_interval_seconds: number;
    member_count?: number;
}

interface UserRes {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_orgs: 0, total_users: 0 });
    
    // Org Edit State
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [editData, setEditData] = useState({
        plan: '',
        monitoring_retention_days: 30,
        screenshot_retention_days: 7,
        sync_interval_seconds: 300,
        enabled_modules: [] as string[]
    });

    // User Search State
    const [userSearchText, setUserSearchText] = useState('');
    const [foundUsers, setFoundUsers] = useState<UserRes[]>([]);
    const [resettingUser, setResettingUser] = useState<UserRes | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await api.get('/superadmin/organizations', token);
            if (Array.isArray(data)) {
                setOrganizations(data);
                // Calc basic stats
                const totalUsers = data.reduce((acc: number, curr: Organization) => acc + (curr.member_count || 0), 0);
                setStats({ total_orgs: data.length, total_users: totalUsers });
            }
        } catch (err) {
            console.error('Failed to fetch orgs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleEditOrg = (org: Organization) => {
        setEditingOrg(org);
        setEditData({
            plan: org.plan || 'free',
            monitoring_retention_days: org.monitoring_retention_days || 30,
            screenshot_retention_days: org.screenshot_retention_days || 7,
            sync_interval_seconds: org.sync_interval_seconds || 300,
            enabled_modules: org.enabled_modules || []
        });
    };

    const handleSaveOrg = async () => {
        try {
            if (!editingOrg || !token) return;
            await api.patch(`/superadmin/organizations/${editingOrg.id}`, editData, token);
            setEditingOrg(null);
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save organization settings');
        }
    };

    const handleSearchUsers = async () => {
        if (!userSearchText || !token) return;
        try {
            const data = await api.get(`/superadmin/users?email=${encodeURIComponent(userSearchText)}`, token);
            setFoundUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('User search failed:', err);
        }
    };

    const handleResetPassword = async () => {
        try {
            if (!resettingUser || !token) return;
            await api.post(`/superadmin/users/${resettingUser.id}/reset-password`, { new_password: newPassword }, token);
            alert(`Password for ${resettingUser.email} has been reset.`);
            setResettingUser(null);
            setNewPassword('');
        } catch (err) {
            console.error('Reset failed:', err);
            alert('Failed to reset password');
        }
    };

    const handleTriggerCleanup = async () => {
        if (!confirm('This will permanently delete old logs and screenshots across all organizations based on their retention policies. Proceed?')) return;
        try {
            if (!token) return;
            const data = await api.delete('/superadmin/data/cleanup', token);
            alert(`Cleanup finished. Deleted ${data.activities_deleted} logs and ${data.screenshots_deleted} screenshots.`);
        } catch (err) {
            console.error('Cleanup failed:', err);
            alert('Cleanup failed');
        }
    };

    const toggleModule = (moduleName: string) => {
        const modules = [...editData.enabled_modules];
        if (modules.includes(moduleName)) {
            setEditData({ ...editData, enabled_modules: modules.filter(m => m !== moduleName) });
        } else {
            setEditData({ ...editData, enabled_modules: [...modules, moduleName] });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        SaaS Management Center
                    </h1>
                    <p className="text-slate-500 font-medium">Platform-wide administration and organizational control.</p>
                </div>
                <button 
                    onClick={handleTriggerCleanup}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Enforce Data Retention
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Globe className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orgs</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total_orgs}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-violet-50 rounded-2xl text-violet-600"><Users className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Users</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total_users}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Shield className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                        <p className="text-2xl font-black text-slate-900">Health Check: OK</p>
                    </div>
                </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-600" />
                        Organizations
                    </h2>
                    <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><RefreshCw className="w-4 h-4" /></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Users</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention (Log/Screen)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Interval</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {organizations.map(org => (
                                <tr key={org.id} className="hover:bg-slate-50/30 transition-all">
                                    <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                                    <td className="px-6 py-4 lowercase"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{org.plan}</span></td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">{org.member_count}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{org.monitoring_retention_days || 30}d / {org.screenshot_retention_days || 7}d</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{org.sync_interval_seconds || 300}s</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleEditOrg(org)}
                                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Search & Password Reset */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Key className="w-5 h-5 text-violet-600" />
                        Account Management
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Search user by email..."
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={userSearchText}
                            onChange={(e) => setUserSearchText(e.target.value)}
                        />
                        <button 
                            onClick={handleSearchUsers}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-black transition-all"
                        >
                            Search
                        </button>
                    </div>

                    {foundUsers.length > 0 && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            {foundUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-slate-900">{u.full_name}</p>
                                        <p className="text-xs text-slate-500">{u.email} • {u.role}</p>
                                    </div>
                                    <button 
                                        onClick={() => setResettingUser(u)}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-100"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Org Edit Modal */}
            {editingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configure {editingOrg.name}</h3>
                                <p className="text-xs font-bold text-slate-400">Settings update for this organization.</p>
                            </div>
                            <button onClick={() => setEditingOrg(null)} className="p-2 hover:bg-white rounded-xl text-slate-400"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="p-8 grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subscription Plan</label>
                                <select 
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold"
                                    value={editData.plan}
                                    onChange={(e) => setEditData({...editData, plan: e.target.value})}
                                >
                                    <option value="free">Free Tier</option>
                                    <option value="pro">Pro Plan</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sync Interval (Seconds)</label>
                                <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3">
                                    <Clock className="w-4 h-4 text-slate-400 mr-2" />
                                    <input 
                                        type="number" 
                                        className="bg-transparent border-none w-full font-bold outline-none"
                                        value={editData.sync_interval_seconds}
                                        onChange={(e) => setEditData({...editData, sync_interval_seconds: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Log Retention (Days)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold"
                                    value={editData.monitoring_retention_days}
                                    onChange={(e) => setEditData({...editData, monitoring_retention_days: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Screen Data Retention (Days)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold"
                                    value={editData.screenshot_retention_days}
                                    onChange={(e) => setEditData({...editData, screenshot_retention_days: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Enabled Modules</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['monitoring', 'tasks', 'educational', 'integrity'].map(mod => (
                                        <button 
                                            key={mod}
                                            onClick={() => toggleModule(mod)}
                                            className={`flex items-center justify-center p-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all
                                                ${editData.enabled_modules.includes(mod) 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                                            `}
                                        >
                                            {mod}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setEditingOrg(null)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                            <button 
                                onClick={handleSaveOrg}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-black"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {resettingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Key className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Reset User Password</h3>
                                <p className="text-sm text-slate-400">Forcing new password for {resettingUser.email}</p>
                            </div>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Enter new password..."
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-violet-100"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setResettingUser(null)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
                                    <button 
                                        onClick={handleResetPassword}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Confirm Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
