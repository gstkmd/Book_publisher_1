'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, FileText, History, Edit3, Eye, Trash2, Share2, Download } from 'lucide-react';
import Link from 'next/link';

export default function ContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { token, user } = useAuth();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && id) {
            fetchContentDetails();
        }
    }, [token, id]);

    const fetchContentDetails = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/generic/content/${id}`, token!);
            setContent(data);
        } catch (err) {
            console.error('Failed to fetch content details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this content? This cannot be undone.')) return;
        try {
            await api.delete(`/generic/content/${id}`, token!);
            router.push('/dashboard/library');
        } catch (err) {
            console.error(err);
            alert('Failed to delete content');
        }
    };

    const handleShareClick = (content: any) => {
        alert('Share feature is coming soon! You can also share by creating a task for this content.');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!content) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <p className="text-gray-500 mb-4">Content not found</p>
            <button onClick={() => router.push('/dashboard/library')} className="text-indigo-600 font-bold">Back to Library</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                <div></div> {/* Spacer to keep the Edit button on the right */}

                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/editor/${id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Edit3 className="w-4 h-4" />
                        Edit Content
                    </Link>
                </div>
            </div>

            <div className="w-full p-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-12 border-b border-gray-50">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                        {content.type?.replace('_', ' ') || 'Content'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${content.status === 'published' ? 'bg-green-50 text-green-700 border-green-100' :
                                        content.status === 'review' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        {content.status || 'draft'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                                    {content.title || 'Untitled Content'}
                                </h1>
                                <p className="text-gray-500 text-lg max-w-2xl font-medium">
                                    {content.description || 'No description provided for this content.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 bg-gray-50/30">
                        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                            <h2 className="text-sm font-black text-gray-600 uppercase tracking-widest mb-8 pb-4 border-b border-gray-50">Document Content</h2>
                            <div
                                className="prose prose-indigo max-w-none text-gray-800"
                                dangerouslySetInnerHTML={{ __html: typeof content.body === 'string' ? content.body : (content.body?.text || '') }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                        <Link href={`/dashboard/library/${id}/review`} className="p-8 hover:bg-teal-50/50 transition-colors group">
                            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Eye className="w-6 h-6 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Review Mode</h3>
                            <p className="text-gray-500 text-sm font-medium">Read and review the content with inline comments.</p>
                        </Link>

                        <Link href={`/dashboard/library/${id}/versions`} className="p-8 hover:bg-indigo-50/50 transition-colors group">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <History className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Version History</h3>
                            <p className="text-gray-500 text-sm font-medium">Track changes and restore previous versions.</p>
                        </Link>

                        <div className="p-8 space-y-6">
                            <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleShareClick(content)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                                >
                                    <Share2 className="w-5 h-5 text-gray-600" />
                                    <span className="text-[10px] font-black uppercase text-gray-600">Share</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                                        window.open(`${apiUrl}/generic/export_content/${id}?format=docx`, '_blank');
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                                >
                                    <Download className="w-5 h-5 text-gray-600" />
                                    <span className="text-[10px] font-black uppercase text-gray-600">Export</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors col-span-2"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                    <span className="text-[10px] font-black uppercase text-red-600">Delete Content</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
