'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import ModuleGuard from '@/components/ModuleGuard';

export default function LessonPlansPage() {
    const { token } = useAuth();
    const [lessonPlans, setLessonPlans] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchLessonPlans();
    }, [token]);

    const fetchLessonPlans = async () => {
        try {
            const data = await api.get('/educational/lesson_plans', token!);
            setLessonPlans(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ModuleGuard moduleName="educational">
            <div className="container mx-auto p-8 text-slate-900">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Lesson Plans</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Structured curriculum mapping and session details.</p>
                    </div>
                    <Link
                        href="/dashboard/lesson-plans/create"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                    >
                        + Create Lesson Plan
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessonPlans.map((plan) => (
                        <div key={plan._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                            <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{plan.title}</h3>
                            <p className="text-slate-500 font-medium mb-4 line-clamp-2 text-sm leading-relaxed">{plan.objectives?.join(', ') || 'No specific objectives defined'}</p>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                                <span>Grade: {plan.grade_level}</span>
                                <span className="text-indigo-600">Duration: {plan.duration || 'N/A'}</span>
                            </div>
                            <Link
                                href={`/dashboard/lesson-plans/${plan._id}`}
                                className="block mt-4 text-center text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors border-t border-slate-50 pt-4"
                            >
                                View Detailed Plan
                            </Link>
                        </div>
                    ))}

                    {lessonPlans.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No lesson plans found</p>
                            <Link href="/dashboard/lesson-plans/create" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">
                                Click here to create your first lesson plan.
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ModuleGuard>
    );
}
