'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const OrgSettings = () => {
    const { token } = useAuth();
    const [org, setOrg] = useState<any>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) fetchOrg();
    }, [token]);

    const fetchOrg = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrg(data);
            setName(data.name);
        } catch (err) { console.error(err); }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put('/organizations/me', { name }, token!);
            alert('Organization updated!');
        } catch (err) {
            alert('Failed to update.');
        } finally {
            setLoading(false);
        }
    };

    if (!org) return <div>Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Organization Profile</h2>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input
                    type="text"
                    value={org.slug}
                    disabled
                    className="w-full p-2 border rounded bg-gray-100 text-gray-500"
                />
            </div>
            <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};
