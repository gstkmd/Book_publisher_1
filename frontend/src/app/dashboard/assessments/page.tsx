'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

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
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Assessments</h1>
                <Link
                    href="/dashboard/assessments/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Create Assessment
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((assessment) => (
                    <div key={assessment._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                        <h3 className="text-xl font-bold mb-2">{assessment.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{assessment.description || 'No description'}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                            <span>Type: {assessment.type}</span>
                            <span>Questions: {assessment.questions?.length || 0}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Grade: {assessment.grade_level}
                        </div>
                        <Link
                            href={`/dashboard/assessments/${assessment._id}`}
                            className="block mt-4 text-center text-blue-600 hover:underline border-t pt-2"
                        >
                            View Details
                        </Link>
                    </div>
                ))}

                {assessments.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12">
                        No assessments yet. Create your first one!
                    </div>
                )}
            </div>
        </div>
    );
}
