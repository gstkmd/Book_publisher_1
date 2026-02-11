'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ContentLibrary() {
    const { token } = useAuth();
    const [contents, setContents] = useState<any[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (token) fetchContent();
    }, [token]);

    const fetchContent = async () => {
        try {
            const data = await api.get('/generic/content', token!);
            setContents(data);
        } catch (err) { console.error(err); }
    };

    const filteredContent = contents.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter; // assuming 'status' field exists
    });

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Content Library</h1>
                <Link href="/dashboard/editor/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + New Content
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between mb-6 bg-white p-4 rounded shadow">
                <div className="space-x-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-gray-200 font-bold' : 'text-gray-600'}`}
                    >All</button>
                    <button
                        onClick={() => setFilter('draft')}
                        className={`px-3 py-1 rounded ${filter === 'draft' ? 'bg-gray-200 font-bold' : 'text-gray-600'}`}
                    >Drafts</button>
                    <button
                        onClick={() => setFilter('published')}
                        className={`px-3 py-1 rounded ${filter === 'published' ? 'bg-gray-200 font-bold' : 'text-gray-600'}`}
                    >Published</button>
                </div>
                <div>
                    <button onClick={() => setView('grid')} className={`mr-2 ${view === 'grid' ? 'text-blue-600' : 'text-gray-400'}`}>Grid</button>
                    <button onClick={() => setView('list')} className={`${view === 'list' ? 'text-blue-600' : 'text-gray-400'}`}>List</button>
                </div>
            </div>

            {/* Grid View */}
            {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredContent.map(c => (
                        <div key={c._id} className="bg-white p-4 rounded shadow hover:shadow-lg transition">
                            <div className="h-32 bg-gray-100 mb-4 flex items-center justify-center text-gray-400 rounded">
                                {c.cover_image ? <img src={c.cover_image} className="h-full object-cover" /> : 'No Cover'}
                            </div>
                            <h3 className="font-bold text-lg mb-1 truncate">{c.title}</h3>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-xs">{c.status || 'draft'}</span>
                                <span>{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <Link href={`/dashboard/editor/${c._id}`} className="block mt-4 text-center text-blue-600 hover:underline border-t pt-2">
                                Edit
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="bg-white rounded shadow">
                    {filteredContent.map(c => (
                        <div key={c._id} className="flex justify-between items-center p-4 border-b hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded"></div>
                                <div>
                                    <div className="font-bold">{c.title}</div>
                                    <div className="text-xs text-gray-500">Last edited: {new Date(c.updated_at || c.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">{c.status || 'draft'}</span>
                                <Link href={`/dashboard/editor/${c._id}`} className="text-blue-600 hover:underline">Edit</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
