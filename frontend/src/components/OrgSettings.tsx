'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RoleManager } from './RoleManager';

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
        titleOptions: '',
        contentTypeOptions: 'article, book_chapter, lesson, resource',
        customFields: []
    });
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

    // Create Mode
    const [createName, setCreateName] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [creating, setCreating] = useState(false);

    // Integrations: Copyleaks
    const [clEmail, setClEmail] = useState('');
    const [clApiKey, setClApiKey] = useState('');
    const [credits, setCredits] = useState<any>(null);
    const [checkingCredits, setCheckingCredits] = useState(false);
    
    // Website Categorization
    const [threatDomains, setThreatDomains] = useState<string[]>([]);
    const [productiveDomains, setProductiveDomains] = useState<string[]>([]);
    const [newThreat, setNewThreat] = useState('');
    const [newProductive, setNewProductive] = useState('');

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
                        titleOptions: data.content_settings.titleOptions || '',
                        contentTypeOptions: data.content_settings.contentTypeOptions || 'article, book_chapter, lesson, resource',
                        customFields: data.content_settings.customFields || []
                    });
                }
                if (data.copyleaks_email) setClEmail(data.copyleaks_email);
                setThreatDomains(data.threat_domains || []);
                setProductiveDomains(data.productive_domains || []);
                setRolePermissions(data.role_permissions || {});
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
                content_settings: contentSettings,
                copyleaks_email: clEmail,
                copyleaks_api_key: clApiKey,
                threat_domains: threatDomains,
                productive_domains: productiveDomains,
                role_permissions: rolePermissions
            }, token!);
            alert('Organization updated!');
            setClApiKey(''); // Clear the password field after saving
        } catch (err) {
            alert('Failed to update.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCredits = async () => {
        setCheckingCredits(true);
        try {
            const data = await api.get('/integrity/verify/credits', token!);
            setCredits(data);
        } catch (err: any) {
            alert('Failed to fetch credits. Ensure your Copyleaks keys are valid.');
            setCredits(null);
        } finally {
            setCheckingCredits(false);
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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Content Form Configuration</h2>
                    <a
                        href="/dashboard/settings/mappings"
                        className="text-sm bg-purple-50 text-purple-600 px-4 py-2 rounded-lg border border-purple-200 hover:bg-purple-100 font-medium transition-colors"
                    >
                        Manage Preset Mappings →
                    </a>
                </div>
                <p className="text-sm text-gray-600 mb-6">Customize labels, define content types, and provide ready-made suggestions for your organization's content forms.</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">{contentSettings.labels.title} Label</label>
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
                        <label className="block text-sm font-medium mb-1">{contentSettings.labels.title} Options (comma separated)</label>
                        <input
                            type="text"
                            value={contentSettings.titleOptions}
                            placeholder="e.g. Science Part 1, Science Part 2"
                            onChange={e => setContentSettings({
                                ...contentSettings,
                                titleOptions: e.target.value
                            })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Body (Content) Label</label>
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
                    <div>
                        <label className="block text-sm font-medium mb-1">Allowed Content Types (comma separated)</label>
                        <input
                            type="text"
                            value={contentSettings.contentTypeOptions}
                            placeholder="e.g. Main Book, Supplementary, Worksheet"
                            onChange={e => setContentSettings({
                                ...contentSettings,
                                contentTypeOptions: e.target.value
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
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {contentSettings.customFields.length === 0 && (
                        <p className="text-sm text-center text-gray-600 py-4 italic border-2 border-dashed rounded">No custom fields defined yet.</p>
                    )}
                </div>
            </div>
            
            {/* Role & Permission Management Section */}
            <RoleManager 
                rolePermissions={rolePermissions}
                onUpdate={setRolePermissions}
            />

            {/* Website Categorization Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-blue-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                        </svg>
                    </span>
                    Website Categorization
                </h2>
                <p className="text-sm text-gray-500 mb-6">Manage which domains are tracked as Useful (Work-related) or Threats (Distractions) for your organization.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Threat Domains */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-red-700 uppercase tracking-tight">🚫 Distraction / Threat Domains</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newThreat}
                                onChange={e => setNewThreat(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newThreat) { setThreatDomains([...threatDomains, newThreat]); setNewThreat(''); } } }}
                                placeholder="e.g. facebook.com"
                                className="flex-1 p-2 border rounded text-sm focus:border-red-400 focus:outline-none"
                            />
                            <button
                                onClick={() => { if (newThreat) { setThreatDomains([...threatDomains, newThreat]); setNewThreat(''); } }}
                                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-red-50/30 rounded-lg">
                            {threatDomains.length === 0 && <span className="text-xs text-gray-400 italic">No threat domains added.</span>}
                            {threatDomains.map((domain, i) => (
                                <span key={i} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-100 flex items-center gap-2">
                                    {domain}
                                    <button onClick={() => setThreatDomains(threatDomains.filter((_, idx) => idx !== i))} className="hover:text-red-900 font-bold">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Productive Domains */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-green-700 uppercase tracking-tight">✅ Work-Essential / Useful Domains</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newProductive}
                                onChange={e => setNewProductive(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newProductive) { setProductiveDomains([...productiveDomains, newProductive]); setNewProductive(''); } } }}
                                placeholder="e.g. github.com"
                                className="flex-1 p-2 border rounded text-sm focus:border-green-400 focus:outline-none"
                            />
                            <button
                                onClick={() => { if (newProductive) { setProductiveDomains([...productiveDomains, newProductive]); setNewProductive(''); } }}
                                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-green-50/30 rounded-lg">
                            {productiveDomains.length === 0 && <span className="text-xs text-gray-400 italic">No useful domains added.</span>}
                            {productiveDomains.map((domain, i) => (
                                <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-100 flex items-center gap-2">
                                    {domain}
                                    <button onClick={() => setProductiveDomains(productiveDomains.filter((_, idx) => idx !== i))} className="hover:text-green-900 font-bold">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Integrations Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-purple-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.335 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM9 11V1h2v10h5l-6 6-6-6h5z" />
                        </svg>
                    </span>
                    Copyleaks Integration
                </h2>
                <p className="text-sm text-gray-500 mb-6">Manage your unique plagiarism and AI detection credentials. Fees will be billed directly to your Copyleaks account.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Copyleaks Email</label>
                        <input
                            type="email"
                            value={clEmail}
                            onChange={e => setClEmail(e.target.value)}
                            placeholder="admin@your-org.com"
                            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">API Key / Secret</label>
                        <input
                            type="password"
                            value={clApiKey}
                            onChange={e => setClApiKey(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-purple-400 focus:outline-none transition-all font-mono"
                        />
                    </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-purple-900 mb-1">Credit Balance</h3>
                            {!credits ? (
                                <p className="text-sm text-purple-600">Click the button to check your remaining scans.</p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex gap-4">
                                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                                            <span className="text-xs text-gray-400 block uppercase font-bold">Credits</span>
                                            <span className="text-xl font-black text-purple-700">{credits.credits || 0}</span>
                                        </div>
                                        {/* Optional extra info if Copyleaks returns it */}
                                    </div>
                                    <p className="text-xs text-purple-400 mt-2 italic">Balance fetched in real-time from Copyleaks.</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={fetchCredits}
                            disabled={checkingCredits}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                                checkingCredits 
                                ? 'bg-purple-200 text-purple-400 cursor-not-allowed' 
                                : 'bg-white text-purple-600 hover:shadow-lg hover:-translate-y-0.5 border-2 border-purple-100'
                            }`}
                        >
                            {checkingCredits && (
                                <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Check Live Balance
                        </button>
                    </div>
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
        </div >
    );
};
