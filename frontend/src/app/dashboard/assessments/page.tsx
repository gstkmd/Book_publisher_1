'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';

export default function AssessmentsPage() {
    const { token } = useAuth();
    const [assessments, setAssessments] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchAssessments();
    }, [token]);

    const fetchAssessments = async () => {
        try {
            const data = await api.get('/educational/assessments', token!);
            setAssessments(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ModuleGuard moduleName="educational">
            <div className="container mx-auto p-8 text-slate-900">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Assessments & Exams</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage tests, quizzes, and performance evaluations.</p>
                    </div>
                    <Link
                        href="/dashboard/assessments/create"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                    >
                        + Create Assessment
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                        <div key={assessment._id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                            <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{assessment.title}</h3>
                            <p className="text-slate-500 font-medium mb-6 line-clamp-2 text-sm leading-relaxed">{assessment.description || 'Comprehensive evaluation resource'}</p>
                            
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                <div className="bg-slate-50 p-2 rounded-xl text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Type</p>
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{assessment.type}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Questions</p>
                                    <p className="text-[10px] font-bold text-indigo-600 truncate">{assessment.questions?.length || 0} items</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Grade: {assessment.grade_level}</span>
                                <Link
                                    href={`/dashboard/assessments/${assessment._id}`}
                                    className="text-indigo-600 font-black uppercase tracking-widest text-[9px] hover:text-slate-900 transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}

                    {assessments.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No assessments available</p>
                            <Link href="/dashboard/assessments/create" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">
                                Start by creating your first assessment.
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ModuleGuard>
    );
}
