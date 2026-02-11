'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Content {
    id: string;
    title: string;
}

interface Standard {
    id: string;
    code: string;
    description: string;
}

interface LessonPlan {
    id: string;
    title: string;
    objectives: string[];
    activities: { time: string; description: string; resource: string }[];
}

export default function CreateLessonPlanPage() {
    const [contents, setContents] = useState<Content[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [selectedContent, setSelectedContent] = useState('');
    const [selectedStandard, setSelectedStandard] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        api.get('/generic/content').then(setContents).catch(console.error);
        api.get('/educational/standards').then(setStandards).catch(console.error);
    }, []);

    const handleGenerate = async () => {
        if (!selectedContent || !selectedStandard) return;
        setLoading(true);
        try {
            const plan = await api.post(
                `/educational/lesson-plans/generate?content_id=${selectedContent}&standard_id=${selectedStandard}`,
                {},
                token || undefined
            );
            setGeneratedPlan(plan);
        } catch (err) {
            console.error(err);
            alert('Failed to generate lesson plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Lesson Plan Generator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Content Resource</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={selectedContent}
                        onChange={e => setSelectedContent(e.target.value)}
                    >
                        <option value="">-- Choose Content --</option>
                        {contents.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Standard</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={selectedStandard}
                        onChange={e => setSelectedStandard(e.target.value)}
                    >
                        <option value="">-- Choose Standard --</option>
                        {standards.map(s => (
                            <option key={s.id} value={s.id}>{s.code} - {s.description.substring(0, 50)}...</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-center mb-8">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedContent || !selectedStandard}
                    className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition shadow-lg"
                >
                    {loading ? 'Generating Plan...' : 'Generate Lesson Plan with AI'}
                </button>
            </div>

            {generatedPlan && (
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 text-indigo-800">{generatedPlan.title}</h2>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1">Learning Objectives</h3>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            {generatedPlan.objectives.map((obj, i) => (
                                <li key={i}>{obj}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-1">Lesson Activities</h3>
                        <div className="space-y-4">
                            {generatedPlan.activities.map((act, i) => (
                                <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded border-l-4 border-indigo-500">
                                    <div className="font-bold text-indigo-600 w-24 shrink-0">{act.time}</div>
                                    <div>
                                        <p className="font-medium text-gray-800">{act.description}</p>
                                        {act.resource && (
                                            <p className="text-sm text-gray-500 mt-1">Resource: {act.resource}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
