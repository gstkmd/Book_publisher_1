'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Curriculum Standards</h1>

            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search standards (e.g. MATH.5.NF)..."
                    className="p-2 border rounded w-full md:w-1/2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Upload */}
                <div className="flex items-center gap-2">
                    <label className="btn bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
                        {uploading ? 'Uploading...' : 'Upload JSON'}
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {standards.map((std) => (
                    <div key={std.id} className="p-4 border rounded bg-white shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-blue-800">{std.code}</h3>
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{std.subject} - {std.grade_level}</span>
                        </div>
                        <p className="text-gray-700 mt-2">{std.description}</p>
                    </div>
                ))}

                {standards.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No standards found. Try uploading a JSON file.</p>
                )}
            </div>
        </div>
    );
}
