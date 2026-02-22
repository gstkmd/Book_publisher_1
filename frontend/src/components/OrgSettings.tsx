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
    const [contentSettings, setContentSettings] = useState<any>({
        labels: { title: 'Title', body: 'Content' },
        customFields: []
    });

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
                if (data.content_settings) {
                    setContentSettings({
                        labels: data.content_settings.labels || { title: 'Title', body: 'Content' },
                        customFields: data.content_settings.customFields || []
                    });
                }
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
            await api.put('/organizations/me', {
                name,
                slug,
                content_settings: contentSettings
            }, token!);
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

    const addCustomField = () => {
        setContentSettings({
            ...contentSettings,
            customFields: [...contentSettings.customFields, { name: '', label: '', options: '' }]
        });
    };

    const updateCustomField = (index: number, field: string, value: string) => {
        const newFields = [...contentSettings.customFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setContentSettings({ ...contentSettings, customFields: newFields });
    };

    const removeCustomField = (index: number) => {
        const newFields = contentSettings.customFields.filter((_: any, i: number) => i !== index);
        setContentSettings({ ...contentSettings, customFields: newFields });
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
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
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
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Content Form Configuration</h2>
                <p className="text-sm text-gray-600 mb-6">Customize labels and add specific fields for your organization's content.</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title Label (e.g., Book Name)</label>
                        <input
                            type="text"
                            value={contentSettings.labels.title}
                            onChange={e => setContentSettings({
                                ...contentSettings,
                                labels: { ...contentSettings.labels, title: e.target.value }
                            })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Body Label (e.g., Content)</label>
                        <input
                            type="text"
                            value={contentSettings.labels.body}
                            onChange={e => setContentSettings({
                                ...contentSettings,
                                labels: { ...contentSettings.labels, body: e.target.value }
                            })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Custom Fields</h3>
                        <button
                            onClick={addCustomField}
                            className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100"
                        >
                            + Add Field
                        </button>
                    </div>

                    {contentSettings.customFields.map((field: any, index: number) => (
                        <div key={index} className="flex gap-4 items-end bg-gray-50 p-3 rounded border">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Field Name (ID)</label>
                                <input
                                    type="text"
                                    value={field.name}
                                    placeholder="e.g. subject"
                                    onChange={e => updateCustomField(index, 'name', e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Label</label>
                                <input
                                    type="text"
                                    value={field.label}
                                    placeholder="e.g. Subject"
                                    onChange={e => updateCustomField(index, 'label', e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Options (comma separated)</label>
                                <input
                                    type="text"
                                    value={field.options || ''}
                                    placeholder="e.g. Math, Science, History"
                                    onChange={e => updateCustomField(index, 'options', e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <button
                                onClick={() => removeCustomField(index)}
                                className="text-red-500 hover:text-red-700 p-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {contentSettings.customFields.length === 0 && (
                        <p className="text-sm text-center text-gray-400 py-4 italic border-2 border-dashed rounded">No custom fields defined yet.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Organization Settings'}
                </button>
            </div>
        </div>
    );
};
