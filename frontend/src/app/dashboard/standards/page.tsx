'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';

interface Standard {
    id: string;
    code: string;
    description: string;
    subject: string;
    grade_level: string;
}

export default function StandardsDashboard() {
    const [standards, setStandards] = useState<Standard[]>([]);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchStandards();
    }, [search]);

    const fetchStandards = async () => {
        try {
            const query = search ? `?q=${encodeURIComponent(search)}` : '';
            const data = await api.get(`/educational/standards${query}`, token || undefined);
            setStandards(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/educational/standards/upload', formData, token || undefined, true);
            alert('Standards uploaded successfully!');
            fetchStandards();
        } catch (err) {
            console.error(err);
            alert('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <ModuleGuard moduleName="standards">
            <div className="container mx-auto p-8 text-slate-900">
                <h1 className="text-3xl font-black mb-6 uppercase tracking-tight">Curriculum Standards</h1>

                <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search standards (e.g. MATH.5.NF)..."
                        className="p-3 border border-slate-200 rounded-xl w-full md:w-1/2 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Upload */}
                    <div className="flex items-center gap-2">
                        <label className="bg-indigo-600 text-white px-6 py-3 rounded-xl cursor-pointer hover:bg-slate-900 transition-all font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 flex items-center gap-2">
                            {uploading ? 'Uploading...' : 'Upload Standards (JSON)'}
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standards.map((std) => (
                        <div key={std.id} className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-black text-indigo-600 tracking-tight transition-colors group-hover:text-slate-900">{std.code}</h3>
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{std.subject} • {std.grade_level}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-sm leading-relaxed">{std.description}</p>
                        </div>
                    ))}

                    {standards.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No standards found</p>
                            <p className="text-slate-400 text-xs mt-1">Try uploading a curriculum JSON file to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </ModuleGuard>
    );
}
