'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const MemberList = () => {
    const { token } = useAuth();
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchMembers();
    }, [token]);

    const fetchMembers = async () => {
        try {
            const data = await api.get('/organizations/members', token!);
            setMembers(data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
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
            <button className="mt-4 text-blue-600 text-sm hover:underline">+ Invite Member (Pro)</button>
        </div>
    );
};
