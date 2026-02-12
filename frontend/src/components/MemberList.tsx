'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const MemberList = () => {
    const { token } = useAuth();
    const [members, setMembers] = useState<any[]>([]);

    // Invite State
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (token) fetchMembers();
    }, [token]);

    const fetchMembers = async () => {
        try {
            const data = await api.get('/organizations/members', token!);
            setMembers(data);
        } catch (err) { console.error(err); }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            await api.post('/organizations/invite', {
                email: inviteEmail,
                full_name: inviteName,
                password: invitePassword
            }, token!);
            alert('Member added successfully!');
            setShowInvite(false);
            setInviteEmail('');
            setInviteName('');
            setInvitePassword('');
            fetchMembers();
        } catch (err: any) {
            alert(err.message || 'Failed to invite member');
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6 relative">
            <h2 className="text-xl font-bold mb-4">Team Members</h2>
            <div className="space-y-2">
                {members.map(m => (
                    <div key={m._id || m.email} className="flex justify-between items-center p-3 border rounded">
                        <div>
                            <div className="font-medium">{m.full_name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{m.email}</div>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{m.role}</span>
                    </div>
                ))}
            </div>

            {showInvite ? (
                <div className="mt-4 p-4 border rounded bg-gray-50 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-semibold mb-2">Add Member</h3>
                    <p className="text-xs text-gray-500 mb-3">If the user exists, they will be added. If not, a new account will be created with the credentials below.</p>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                className="w-full p-2 border rounded text-sm"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="John Doe"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password (For new users)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded text-sm font-mono"
                                    placeholder="Temporary123!"
                                    value={invitePassword}
                                    onChange={(e) => setInvitePassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleInvite}
                                disabled={inviting}
                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {inviting ? 'Processing...' : 'Add / Create User'}
                            </button>
                            <button
                                onClick={() => setShowInvite(false)}
                                className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowInvite(true)}
                    className="mt-4 text-blue-600 text-sm hover:underline"
                >
                    + Invite Member
                </button>
            )}
        </div>
    );
};
