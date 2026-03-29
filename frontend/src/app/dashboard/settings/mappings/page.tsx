'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function PresetMappingsPage() {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const [org, setOrg] = useState<any>(null);
    const [mappings, setMappings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
        if (token) fetchOrg();
    }, [user, isLoading, token]);

    const fetchOrg = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrg(data);
            setMappings(data.content_settings?.mappings || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedSettings = {
                ...org.content_settings,
                mappings
            };
            await api.put('/organizations/me', {
                content_settings: updatedSettings
            }, token!);
            alert('Mappings saved!');
        } catch (err) {
            alert('Failed to save mappings.');
        } finally {
            setSaving(false);
        }
    };

    const addMapping = () => {
        setMappings([...mappings, { trigger: '', fields: {} }]);
    };

    const removeMapping = (index: number) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    const updateMappingField = (index: number, fieldName: string, value: string) => {
        const newMappings = [...mappings];
        if (fieldName === 'trigger') {
            newMappings[index].trigger = value;
        } else {
            newMappings[index].fields = {
                ...newMappings[index].fields,
                [fieldName]: value
            };
        }
        setMappings(newMappings);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const labels = org?.content_settings?.labels || { title: 'Title', body: 'Content' };
    const customFields = org?.content_settings?.customFields || [];
    const contentTypes = org?.content_settings?.contentTypeOptions?.split(',').map((t: string) => t.trim()) || ['article', 'book_chapter', 'lesson', 'resource'];

    return (
        <div className="container mx-auto p-8 max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-700">
                    ← Back
                </Link>
                <h1 className="text-3xl font-bold">Preset Mappings</h1>
            </div>

            <p className="text-gray-600 mb-8 italic">
                Define rules to automatically fill content fields when a specific {labels.title} is selected.
            </p>

            <div className="space-y-6">
                {mappings.map((mapping, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
                        <button
                            onClick={() => removeMapping(idx)}
                            className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">If {labels.title} is:</label>
                                <input
                                    type="text"
                                    value={mapping.trigger}
                                    onChange={(e) => updateMappingField(idx, 'trigger', e.target.value)}
                                    placeholder={`e.g. Science Part 1`}
                                    className="w-full p-3 border-2 border-gray-100 rounded-lg focus:border-purple-200 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Auto-fill these fields:</label>
                                <div className="space-y-3">
                                    {/* Type Mapping */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-600 w-20">Type:</span>
                                        <select
                                            value={mapping.fields.type || ''}
                                            onChange={(e) => updateMappingField(idx, 'type', e.target.value)}
                                            className="flex-1 p-2 bg-gray-50 border-0 rounded-md text-sm"
                                        >
                                            <option value="">(Ignore)</option>
                                            {contentTypes.map((type: string) => (
                                                <option key={type} value={type.toLowerCase().trim()}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Custom Fields Mapping */}
                                    {customFields.map((field: any) => (
                                        <div key={field.name} className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 w-20 truncate">{field.label}:</span>
                                            <input
                                                type="text"
                                                value={mapping.fields[field.name] || ''}
                                                onChange={(e) => updateMappingField(idx, field.name, e.target.value)}
                                                placeholder={`Auto-fill value...`}
                                                className="flex-1 p-2 bg-gray-50 border-0 rounded-md text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {mappings.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-600">No preset mappings defined yet.</p>
                        <button
                            onClick={addMapping}
                            className="mt-4 text-purple-600 font-bold hover:underline"
                        >
                            + Create First Mapping
                        </button>
                    </div>
                )}

                {mappings.length > 0 && (
                    <button
                        onClick={addMapping}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-600 font-medium hover:border-purple-200 hover:text-purple-400 transition-all"
                    >
                        + Add Another Mapping rule
                    </button>
                )}
            </div>

            <div className="mt-12 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                >
                    {saving ? 'Saving Rules...' : 'Save All Mappings'}
                </button>
            </div>
        </div>
    );
}
