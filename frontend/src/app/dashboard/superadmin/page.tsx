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
    Package,
    History,
    Mail,
    Server,
    ShieldCheck,
    Send
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    plan: string;
    is_active: boolean;
    enabled_modules: string[];
    hide_disabled_features: boolean;
    monitoring_retention_days: number;
    screenshot_retention_days: number;
    sync_interval_seconds: number;
    member_count?: number;
    db_storage_formatted?: string;
    file_storage_formatted?: string;
    total_storage_formatted?: string;
    usage_updated_at?: string;
    subscription_status: string;
    trial_ends_at?: string;
    plan_display_name?: string;
    plan_price_display?: string;
    max_users?: number;
}

interface UserRes {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

interface SMTPSettings {
    smtp_server: string;
    smtp_port: number;
    smtp_user: string;
    smtp_from_email: string;
    smtp_use_tls: boolean;
    smtp_password_masked?: string;
    updated_at?: string;
}

export default function SuperAdminDashboard() {
    const { token, impersonateOrganization } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_orgs: 0, total_users: 0, total_storage_formatted: '0 B' });
    
    // SMTP State
    const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
        smtp_server: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_from_email: '',
        smtp_use_tls: true
    });
    const [newSmtpPassword, setNewSmtpPassword] = useState('');
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [smtpSuccess, setSmtpSuccess] = useState(false);

    // Org Edit State
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [editData, setEditData] = useState({
        plan: '',
        monitoring_retention_days: 30,
        screenshot_retention_days: 7,
        sync_interval_seconds: 300,
        enabled_modules: [] as string[],
        hide_disabled_features: false,
        plan_display_name: '',
        plan_price_display: '',
        max_users: 10
    });

    // User Search State
    const [userSearchText, setUserSearchText] = useState('');
    const [foundUsers, setFoundUsers] = useState<UserRes[]>([]);
    const [resettingUser, setResettingUser] = useState<UserRes | null>(null);
    const [newPassword, setNewPassword] = useState('');
    
    // Deletion State
    const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const orgsData = await api.get('/superadmin/organizations', token);
            const statsData = await api.get('/superadmin/stats', token);
            const smtpData = await api.get('/superadmin/email-settings', token);
            
            if (Array.isArray(orgsData)) {
                setOrganizations(orgsData);
            }
            
            if (statsData) {
                setStats({
                    total_orgs: statsData.total_orgs,
                    total_users: statsData.total_users,
                    total_storage_formatted: statsData.total_storage_formatted
                });
            }

            if (smtpData) {
                setSmtpSettings(smtpData);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSmtp = async () => {
        setSmtpLoading(true);
        setSmtpSuccess(false);
        try {
            const data: any = { ...smtpSettings };
            if (newSmtpPassword) {
                data.smtp_password = newSmtpPassword;
            }
            await api.patch('/superadmin/email-settings', data, token || undefined);
            setSmtpSuccess(true);
            setNewSmtpPassword('');
            fetchData();
            setTimeout(() => setSmtpSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to save SMTP settings");
        } finally {
            setSmtpLoading(false);
        }
    };

    const handleTestSmtp = async () => {
        setSmtpLoading(true);
        try {
            const res = await api.post('/superadmin/email-settings/test', {}, token || undefined);
            alert(res.message || "Test email sent!");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || "SMTP test failed");
        } finally {
            setSmtpLoading(false);
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
            enabled_modules: org.enabled_modules || [],
            hide_disabled_features: org.hide_disabled_features || false,
            plan_display_name: org.plan_display_name || '',
            plan_price_display: org.plan_price_display || '',
            max_users: org.max_users || 10
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

    const handleDeleteOrg = async () => {
        if (!deletingOrg || !token) return;
        if (deleteConfirmName !== deletingOrg.name) {
            alert('Organization name does not match. Deletion cancelled.');
            return;
        }

        try {
            await api.delete(`/superadmin/organizations/${deletingOrg.id}`, token);
            alert(`Organization ${deletingOrg.name} and all its data have been purged.`);
            setDeletingOrg(null);
            setDeleteConfirmName('');
            fetchData();
        } catch (err) {
            console.error('Deletion failed:', err);
            alert('Failed to delete organization. Please check logs.');
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

    const handleSyncUsage = async () => {
        try {
            await api.post('/superadmin/usage/sync', {}, token || undefined);
            alert("Usage recalculation started in the background!");
        } catch (err) {
            console.error(err);
            alert("Failed to start usage sync");
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Database className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Storage</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total_storage_formatted}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Shield className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">Healthy</p>
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
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSyncUsage}
                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                            title="Recalculate storage usage for all organizations"
                        >
                            <History className="w-3.5 h-3.5" />
                            RECALCULATE USAGE
                        </button>
                        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Users</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention (Log/Screen)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">DB Space</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Files</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Interval</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {organizations.map(org => (
                                <tr key={org.id} className="hover:bg-slate-50/30 transition-all">
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => impersonateOrganization(org.id)}
                                            className="font-black text-slate-900 hover:text-indigo-600 transition-all text-left uppercase tracking-tight"
                                        >
                                            {org.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 lowercase"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{org.plan}</span></td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">{org.member_count}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{org.monitoring_retention_days || 30}d / {org.screenshot_retention_days || 7}d</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700">{org.db_storage_formatted || '0 B'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700">{org.file_storage_formatted || '0 B'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{org.sync_interval_seconds || 300}s</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleEditOrg(org)}
                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                                                title="Edit Settings"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setDeletingOrg(org);
                                                    setDeleteConfirmName('');
                                                }}
                                                className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                                                title="Delete Organization"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SMTP Settings */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-600" />
                        System Communication (SMTP)
                    </h2>
                    {smtpSettings.updated_at && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Last Updated: {new Date(smtpSettings.updated_at).toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Info Column */}
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Server className="w-4 h-4" /> SMTP Infrastructure
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Configure the platform-wide mail delivery system. These settings are used for password resets, invites, and system notifications.
                                </p>
                            </div>
                            <button 
                                onClick={handleTestSmtp}
                                disabled={smtpLoading || !smtpSettings.smtp_server}
                                className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" /> {smtpLoading ? "Sending Test..." : "Send Test Email"}
                            </button>
                        </div>

                        {/* Form Column */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SMTP Server</label>
                                <input 
                                    type="text" 
                                    placeholder="smtp.gmail.com"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={smtpSettings.smtp_server}
                                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_server: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Port</label>
                                <input 
                                    type="number" 
                                    placeholder="587"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={smtpSettings.smtp_port}
                                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_port: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sender Email</label>
                                <input 
                                    type="email" 
                                    placeholder="noreply@connectpublisher.com"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={smtpSettings.smtp_from_email}
                                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_from_email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SMTP Username</label>
                                <input 
                                    type="text" 
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={smtpSettings.smtp_user}
                                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_user: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SMTP Password</label>
                                <input 
                                    type="password" 
                                    placeholder={smtpSettings.smtp_password_masked || "Enter new password..."}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={newSmtpPassword}
                                    onChange={(e) => setNewSmtpPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mt-4 self-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Use TLS/SSL</p>
                                </div>
                                <button 
                                    onClick={() => setSmtpSettings({...smtpSettings, smtp_use_tls: !smtpSettings.smtp_use_tls})}
                                    className={`w-12 h-6 rounded-full transition-all relative ${smtpSettings.smtp_use_tls ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${smtpSettings.smtp_use_tls ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 pt-4">
                                <button 
                                    onClick={handleSaveSmtp}
                                    disabled={smtpLoading}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg
                                        ${smtpSuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}
                                    `}
                                >
                                    {smtpLoading ? "Saving..." : smtpSuccess ? <><ShieldCheck className="w-4 h-4" /> Settings Saved</> : "Save SMTP Configuration"}
                                </button>
                            </div>
                        </div>
                    </div>
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
                            <div className="col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subscription Plan</label>
                                <div className="grid grid-cols-5 gap-4">
                                    {[
                                        { id: 'trial', label: '10d Trial', color: 'bg-amber-50 text-amber-600 border-amber-100', active: 'bg-amber-600 text-white border-amber-600' },
                                        { id: 'basic_10k', label: 'Basic (10k)', color: 'bg-blue-50 text-blue-600 border-blue-100', active: 'bg-blue-600 text-white border-blue-600' },
                                        { id: 'pro_18k', label: 'Growth (18k)', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', active: 'bg-indigo-600 text-white border-indigo-600' },
                                        { id: 'enterprise', label: 'Enterprise', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', active: 'bg-emerald-600 text-white border-emerald-600' },
                                        { id: 'custom', label: 'Custom Plan', color: 'bg-purple-50 text-purple-600 border-purple-100', active: 'bg-purple-600 text-white border-purple-600' },
                                    ].map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setEditData({...editData, plan: plan.id})}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                                                ${editData.plan === plan.id ? plan.active + ' shadow-lg scale-105' : plan.color + ' hover:border-slate-300'}
                                            `}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{plan.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Plan Details */}
                            {editData.plan === 'custom' && (
                                <div className="col-span-2 grid grid-cols-3 gap-6 p-6 bg-purple-50/30 rounded-[2rem] border border-purple-100 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-1">Plan Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. VIP Enterprise"
                                            className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 font-bold"
                                            value={editData.plan_display_name}
                                            onChange={(e) => setEditData({...editData, plan_display_name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-1">Price Display</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. ₹25,000"
                                            className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 font-bold"
                                            value={editData.plan_price_display}
                                            onChange={(e) => setEditData({...editData, plan_price_display: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-1">Max Users</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 font-bold"
                                            value={editData.max_users}
                                            onChange={(e) => setEditData({...editData, max_users: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            )}
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Feature Control (Granular)</label>
                                <div className="grid grid-cols-3 gap-3 font-bold">
                                    {[
                                        { id: 'library', label: 'Library' },
                                        { id: 'tasks', label: 'Tasks' },
                                        { id: 'workflow', label: 'Workflow' },
                                        { id: 'monitoring', label: 'Monitoring' },
                                        { id: 'standards', label: 'Standards' },
                                        { id: 'lesson_plans', label: 'Lesson Plans' },
                                        { id: 'assessments', label: 'Assessments' },
                                        { id: 'rights', label: 'Rights' },
                                    ].map(feat => (
                                        <button 
                                            key={feat.id}
                                            onClick={() => toggleModule(feat.id)}
                                            className={`flex items-center justify-center p-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all
                                                ${editData.enabled_modules.includes(feat.id) 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                                            `}
                                        >
                                            {feat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Appearance Settings</label>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Hide Disabled Features</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completely remove locked items from the user's sidebar</p>
                                    </div>
                                    <button 
                                        onClick={() => setEditData({...editData, hide_disabled_features: !editData.hide_disabled_features})}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editData.hide_disabled_features ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editData.hide_disabled_features ? 'left-7' : 'left-1'}`} />
                                    </button>
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

            {/* Delete Organization Modal */}
            {deletingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-rose-600 uppercase tracking-tighter">Extreme Danger</h3>
                                <p className="text-sm text-slate-500 font-medium px-4">
                                    You are about to permanently purge <span className="font-black text-slate-900">"{deletingOrg.name}"</span>. 
                                    This will delete all users, monitoring logs, and related content.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        Type <span className="text-slate-900">{deletingOrg.name}</span> to confirm
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Confirm organization name..."
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-rose-200 transition-all"
                                        value={deleteConfirmName}
                                        onChange={(e) => setDeleteConfirmName(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setDeletingOrg(null)} 
                                        className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleDeleteOrg}
                                        disabled={deleteConfirmName !== deletingOrg.name}
                                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all"
                                    >
                                        Purge All Data
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
