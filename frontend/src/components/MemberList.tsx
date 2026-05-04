'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link2, Copy, Check, X, UserPlus, Activity, Camera, Trash2 } from 'lucide-react';
import { TeamService, OrganizationMember } from '@/lib/services/TeamService';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 'user', label: 'Member' },
    { value: 'author', label: 'Author' },
    { value: 'illustrator', label: 'Illustrator' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'section_editor', label: 'Section Editor' },
    { value: 'editor_in_chief', label: 'Editor-in-Chief' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'admin', label: 'Admin' },
];

export const MemberList = () => {
    const { token, user } = useAuth();
    const [members, setMembers] = useState<any[]>([]);

    // Invite modal state
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('admin');
    const [inviting, setInviting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [availableRoles, setAvailableRoles] = useState<{ value: string, label: string }[]>(ROLES);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (token && user?.organization_id) {
            fetchMembers();
            fetchRoles();
        }
    }, [token, user?.organization_id]);

    const fetchRoles = async () => {
        try {
            const orgData = await TeamService.getOrganization(token!);
            if (orgData?.role_permissions && Object.keys(orgData.role_permissions).length > 0) {
                const roles = Object.keys(orgData.role_permissions).map(role => ({
                    value: role,
                    label: role === 'user' ? 'Member' : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }));
                // Ensure admin is always there if not in permissions
                if (!roles.find(r => r.value === 'admin')) {
                    roles.push({ value: 'admin', label: 'Admin' });
                }
                setAvailableRoles(roles);
                
                // Ensure default selected role is valid
                if (!roles.find(r => r.value === inviteRole)) {
                    setInviteRole(roles[0].value);
                }
            }
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    const fetchMembers = async () => {
        try {
            if (!user?.organization_id) return;
            const data = await TeamService.getMembers(user.organization_id, token!);
            setMembers(data);
        } catch (err) { console.error(err); }
    };

    const handleGenerateLink = async () => {
        if (!inviteEmail || !user?.organization_id) {
            toast.error("Missing email or organization ID");
            return;
        }
        setInviting(true);
        setGeneratedLink('');
        try {
            const res = await TeamService.inviteMember(user.organization_id, inviteEmail, inviteRole, token!);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            setGeneratedLink(`${baseUrl}/invite/${res.token}`);
            toast.success("Invite link generated successfully!");
        } catch (err: any) {
            let msg = 'Failed to generate link';
            try { 
                const startIndex = err.message.indexOf('{');
                if (startIndex !== -1) {
                    msg = JSON.parse(err.message.substring(startIndex)).detail || msg; 
                } else if (typeof err.message === 'string') {
                    msg = err.message.replace(/^\d+:\s*/, '');
                }
            } catch { 
                msg = err.message || msg;
            }
            toast.error(typeof msg === 'string' ? msg : 'An unexpected error occurred');
        } finally {
            setInviting(false);
        }
    };

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(generatedLink);
            } else {
                // Fallback for non-HTTPS environments
                const textArea = document.createElement("textarea");
                textArea.value = generatedLink;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    toast.error("Manual copy needed: Select text and press Ctrl+C");
                } finally {
                    textArea.remove();
                }
            }
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
            toast.error("Failed to copy link. Please manually select the link text.");
        }
    };

    const handleCloseInvite = () => {
        setShowInvite(false);
        setInviteEmail('');
        setInviteRole('user');
        setGeneratedLink('');
        setCopied(false);
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean, email: string) => {
        try {
            const { api } = await import('@/lib/api');
            await api.patch(`/organizations/members/${userId}/status?is_active=${!currentStatus}`, {}, token!);
            fetchMembers();
            toast.success("Member status updated");
        } catch (err: any) {
            toast.error('Failed to update status: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { api } = await import('@/lib/api');
            await api.patch(`/organizations/members/${userId}/role?role=${newRole}`, {}, token!);
            fetchMembers();
            toast.success("Member role updated");
        } catch (err: any) {
            toast.error('Failed to update role: ' + (err.message || 'Unknown error'));
        }
    };
    
    const handleToggleMonitoring = async (userId: string, currentStatus: boolean) => {
        try {
            await TeamService.updateMonitoringStatus(userId, !currentStatus, token!);
            fetchMembers();
            toast.success(`Monitoring ${!currentStatus ? 'enabled' : 'disabled'}`);
        } catch (err: any) {
            toast.error('Failed to update monitoring: ' + (err.message || 'Unknown error'));
        }
    };
    
    const handleToggleScreenshots = async (userId: string, currentStatus: boolean) => {
        try {
            await TeamService.updateScreenshotsStatus(userId, !currentStatus, token!);
            fetchMembers();
            toast.success(`Screenshots ${!currentStatus ? 'enabled' : 'disabled'}`);
        } catch (err: any) {
            toast.error('Failed to update screenshots: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteMember = async (userId: string, email: string) => {
        if (userId === user?.id) {
            toast.error("You cannot remove yourself");
            return;
        }
        if (window.confirm(`Are you sure you want to remove ${email} from the organization?`)) {
            try {
                const { api } = await import('@/lib/api');
                await api.delete(`/organizations/members/${userId}`, token!);
                fetchMembers();
                toast.success("Member removed from organization");
            } catch (err: any) {
                toast.error('Failed to remove member: ' + (err.message || 'Unknown error'));
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6 relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Team Members</h2>
                <button
                    type="button"
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            <div className="space-y-2">
                {members.map(m => (
                    <div key={m._id || m.email} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition">
                        <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                                {m.full_name || 'No Name'}
                                {!m.is_active && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500">{m.email}</div>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={m.organization_role || m.role}
                                onChange={(e) => handleRoleChange(m._id, e.target.value)}
                                className="text-xs bg-gray-50 border-none px-2 py-1 rounded capitalize focus:ring-1 focus:ring-blue-500 text-slate-900"
                            >
                                {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <button
                                type="button"
                                onClick={() => handleToggleMonitoring(m._id, m.monitoring_enabled)}
                                className={`p-1.5 rounded-lg transition-all ${m.monitoring_enabled ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                title={m.monitoring_enabled ? "Monitoring Enabled" : "Monitoring Disabled"}
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleScreenshots(m._id, m.screenshots_enabled)}
                                className={`p-1.5 rounded-lg transition-all ${m.screenshots_enabled ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                title={m.screenshots_enabled ? "Screenshots Enabled" : "Screenshots Disabled"}
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(m._id, m.is_active, m.email)}
                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition ${m.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                                {m.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteMember(m._id, m.email)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remove Member"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <p className="text-center text-gray-600 text-sm py-8">No team members yet. Invite someone!</p>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={handleCloseInvite} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900 text-lg">Invite a Team Member</h3>
                                <p className="text-slate-500 text-xs mt-0.5">An invitation will be sent to their email address</p>
                            </div>
                            <button type="button" onClick={handleCloseInvite} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Their Email</label>
                                <input
                                    type="email" autoFocus
                                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                                >
                                    {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateLink} disabled={inviting || !inviteEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UserPlus className="w-4 h-4" />
                                {inviting ? 'Sending…' : 'Send Invitation Email'}
                            </button>

                            {/* Success State */}
                            {generatedLink && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">✅ Invitation Sent!</p>
                                    <p className="text-sm text-emerald-800">
                                        An email has been sent to <strong>{inviteEmail}</strong> with a secure link to join your team.
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Backup Link (just in case):</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                className="flex-1 text-[10px] text-emerald-800 bg-white border border-emerald-200 rounded px-2 py-1.5 font-mono outline-none"
                                                value={generatedLink}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="p-1.5 bg-white border border-emerald-200 text-emerald-600 rounded hover:bg-emerald-50"
                                            >
                                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
