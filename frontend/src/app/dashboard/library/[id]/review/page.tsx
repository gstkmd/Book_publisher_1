'use client';

import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ContentReview from '@/components/ContentReview';

export default function ReviewContentPage() {
    const { token } = useAuth();
    const params = useParams();
    const id = params.id as string;

    if (!token || !id) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 py-3 md:px-4 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link
                            href="/dashboard/library"
                            className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline text-sm font-bold uppercase tracking-widest">Library</span>
                        </Link>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Review Mode</h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Review</span>
                        </div>
                        <Link
                            href={`/dashboard/editor/${id}`}
                            className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-2 py-4 md:px-4 md:py-8">
                <ContentReview contentId={id} />
            </div>
        </div>
    );
}
