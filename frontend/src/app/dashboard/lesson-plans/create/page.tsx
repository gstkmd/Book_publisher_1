'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Content {
    _id: string;
    id?: string;
    title: string;
}

interface Standard {
    _id: string;
    id?: string;
    code: string;
    description: string;
}

interface LessonPlan {
    _id: string;
    title: string;
    standard_id: string;
    plan_content: {
        objectives: string[];
        activities: { time: string; description: string; resource: string }[];
        assessment: string;
    };
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
        if (token) {
            api.get('/generic/content', token).then(setContents).catch(console.error);
            api.get('/educational/standards', token).then(setStandards).catch(console.error);
        }
    }, [token]);

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
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Content Resource</label>
                    <select
                        className="w-full p-2 border rounded bg-white"
                        value={selectedContent}
                        onChange={e => setSelectedContent(e.target.value)}
                    >
                        <option value="">-- Choose Content --</option>
                        {contents.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Standard</label>
                    <select
                        className="w-full p-2 border rounded bg-white"
                        value={selectedStandard}
                        onChange={e => setSelectedStandard(e.target.value)}
                    >
                        <option value="">-- Choose Standard --</option>
                        {standards.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id}>{s.code} - {s.description.substring(0, 50)}...</option>
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
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-black text-indigo-900 mb-1">{generatedPlan.title}</h2>
                            <p className="text-sm text-gray-500">Aligned with Standard: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{standards.find(s => (s._id || s.id) === generatedPlan.standard_id)?.code}</span></p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase italic">AI Generated</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest mb-3">Learning Objectives</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(generatedPlan.plan_content?.objectives || []).map((obj: string, i: number) => (
                                <li key={i} className="flex gap-2 text-gray-700 text-sm bg-indigo-50/30 p-2 rounded">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                    {obj}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest mb-4">Lesson Activities</h3>
                        <div className="space-y-4">
                            {(generatedPlan.plan_content?.activities || []).map((act: any, i: number) => (
                                <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors shadow-sm">
                                    <div className="font-black text-indigo-600 w-20 shrink-0 text-sm border-r border-indigo-100">{act.time}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{act.description}</p>
                                        {act.resource && (
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                Resoure: {act.resource}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-900 rounded-lg text-indigo-100 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-indigo-300">Final Assessment</h3>
                        <p className="text-sm italic leading-relaxed">
                            {generatedPlan.plan_content?.assessment || 'No assessment defined.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
