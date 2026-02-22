'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const OrgSettings = () => {
    // Trigger build fix
    const { token } = useAuth();
    const [org, setOrg] = useState<any>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(true); // Start true
    const [error, setError] = useState(''); // NEW: Error state

    // Create Mode
    const [createName, setCreateName] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (token) fetchOrg();
    }, [token]);

    const fetchOrg = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrg(data);
            if (data) {
                setName(data.name);
                setSlug(data.slug || '');
            } else {
                setOrg(null);
            }
        } catch (err: any) {
            console.error(err);
            // Check if 404 (No Org)
            if (err.message && err.message.includes('404')) {
                setOrg(null); // Valid "No Org" state
            } else {
                // If it's a fetch error or 500
                setError(err.message || 'Failed to load organization.');
                // Do NOT setOrg(null) if we aren't sure
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put('/organizations/me', { name, slug }, token!);
            alert('Organization updated!');
        } catch (err) {
            alert('Failed to update.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!createName || !createSlug) return;
        setCreating(true);
        try {
            const newOrg = await api.post('/organizations/', { name: createName, slug: createSlug }, token!);
            setOrg(newOrg);
            setName(newOrg.name);
            window.location.reload(); // Refresh to update context/sidebar
        } catch (err: any) {
            alert(err.message || 'Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div>Loading Organization...</div>;

    if (error) return (
        <div className="bg-red-50 p-6 rounded-lg shadow mb-6 border-l-4 border-red-500">
            <h3 className="text-lg font-bold text-red-700 mb-2">Error Loading Organization</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
                onClick={() => { setError(''); setLoading(true); fetchOrg(); }}
                className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
            >
                Retry
            </button>
        </div>
    );

    if (!org) return (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-yellow-400">
            <h2 className="text-xl font-bold mb-4">Create Your Organization</h2>
            <p className="mb-4 text-gray-600">You need to create an organization to access features.</p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Organization Name</label>
                    <input
                        type="text"
                        value={createName}
                        onChange={e => {
                            setCreateName(e.target.value);
                            setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                        }}
                        className="w-full p-2 border rounded"
                        placeholder="My Publishing House"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL identifier)</label>
                    <input
                        type="text"
                        value={createSlug}
                        onChange={e => setCreateSlug(e.target.value)}
                        className="w-full p-2 border rounded font-mono text-sm"
                        placeholder="my-publishing-house"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {creating ? 'Creating...' : 'Create Organization'}
                </button>
            </div>
        </div>
    );

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
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full p-2 border rounded font-mono text-sm"
                    placeholder="my-org-slug"
                />
                <p className="text-xs text-amber-600 mt-1">⚠️ Changing the slug may break existing shared links.</p>
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
