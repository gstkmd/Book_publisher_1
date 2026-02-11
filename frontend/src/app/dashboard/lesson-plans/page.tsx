'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

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
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Lesson Plans</h1>
                <Link
                    href="/dashboard/lesson-plans/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Create Lesson Plan
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessonPlans.map((plan) => (
                    <div key={plan._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                        <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{plan.objectives?.join(', ') || 'No objectives'}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Grade: {plan.grade_level}</span>
                            <span>{plan.duration || 'N/A'}</span>
                        </div>
                        <Link
                            href={`/dashboard/lesson-plans/${plan._id}`}
                            className="block mt-4 text-center text-blue-600 hover:underline border-t pt-2"
                        >
                            View Details
                        </Link>
                    </div>
                ))}

                {lessonPlans.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12">
                        No lesson plans yet. Create your first one!
                    </div>
                )}
            </div>
        </div>
    );
}
