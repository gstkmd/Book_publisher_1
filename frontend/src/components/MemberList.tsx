'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Link2, Copy, Check, X, UserPlus } from 'lucide-react';

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
    const { token } = useAuth();
    const [members, setMembers] = useState<any[]>([]);

    // Invite modal state
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [inviting, setInviting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (token) fetchMembers();
    }, [token]);

    const fetchMembers = async () => {
        try {
            const data = await api.get('/organizations/members', token!);
            setMembers(data);
        } catch (err) { console.error(err); }
    };

    const handleGenerateLink = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        setGeneratedLink('');
        try {
            const { token: inviteToken } = await api.post('/organizations/invite-link', {
                email: inviteEmail,
                role: inviteRole
            }, token!);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            setGeneratedLink(`${baseUrl}/join?token=${inviteToken}`);
        } catch (err: any) {
            let msg = 'Failed to generate link';
            try { msg = JSON.parse(err.message).detail || msg; } catch { }
            alert(msg);
        } finally {
            setInviting(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseInvite = () => {
        setShowInvite(false);
        setInviteEmail('');
        setInviteRole('user');
        setGeneratedLink('');
        setCopied(false);
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/organizations/members/${userId}/status?is_active=${!currentStatus}`, {}, token!);
            fetchMembers();
        } catch (err: any) {
            alert('Failed to update status: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/organizations/members/${userId}/role?role=${newRole}`, {}, token!);
            fetchMembers();
        } catch (err: any) {
            alert('Failed to update role: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6 relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Team Members</h2>
                <button
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
                                value={m.role}
                                onChange={(e) => handleRoleChange(m._id, e.target.value)}
                                className="text-xs bg-gray-50 border-none px-2 py-1 rounded capitalize focus:ring-1 focus:ring-blue-500"
                            >
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <button
                                onClick={() => handleToggleStatus(m._id, m.is_active)}
                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition ${m.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                                {m.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No team members yet. Invite someone!</p>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={handleCloseInvite} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900 text-lg">Invite a Team Member</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Generate a secure link — valid for 48 hours</p>
                            </div>
                            <button onClick={handleCloseInvite} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition">
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={handleGenerateLink} disabled={inviting || !inviteEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Link2 className="w-4 h-4" />
                                {inviting ? 'Generating…' : 'Generate Invite Link'}
                            </button>

                            {/* Generated Link */}
                            {generatedLink && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">✅ Link Ready — Share this with your team member</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2 truncate font-mono">
                                            {generatedLink}
                                        </code>
                                        <button
                                            onClick={handleCopy}
                                            className={`shrink-0 p-2 rounded-lg transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 mt-2">⏱ Expires in 48 hours · Can only be used once</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
