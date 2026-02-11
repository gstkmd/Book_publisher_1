'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Question {
    text: string;
    type: 'multiple_choice' | 'open_ended' | 'true_false';
    options: string[];
    correct_answer: string | number;
    bloom_level: string;
}

interface Standard {
    id: string;
    code: string;
    description: string;
}

export default function CreateAssessmentPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [standards, setStandards] = useState<Standard[]>([]);
    const [selectedStandardId, setSelectedStandardId] = useState('');
    const { token } = useAuth();
    const router = useRouter();

    // Load available standards for dropdown
    useEffect(() => {
        api.get('/educational/standards')
            .then(data => setStandards(data))
            .catch(err => console.error(err));
    }, []);

    const addQuestion = () => {
        setQuestions([...questions, {
            text: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: 0,
            bloom_level: 'Remember'
        }]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        try {
            await api.post('/educational/assessments', {
                title,
                description,
                questions,
                aligned_standards: selectedStandardId ? [selectedStandardId] : []
            }, token || undefined);
            alert('Assessment created!');
            router.push('/dashboard/assessments'); // redirect to list (todo)
        } catch (err) {
            console.error(err);
            alert('Failed to create assessment');
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Create New Assessment</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Assessment Title</label>
                    <input
                        type="text"
                        className="mt-1 block w-full p-2 border rounded"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="mt-1 block w-full p-2 border rounded"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Align Standard</label>
                    <select
                        className="mt-1 block w-full p-2 border rounded"
                        value={selectedStandardId}
                        onChange={e => setSelectedStandardId(e.target.value)}
                    >
                        <option value="">Select a Standard...</option>
                        {standards.map(std => (
                            <option key={std.id} value={std.id}>{std.code} - {std.description}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 relative">
                        <h3 className="text-lg font-semibold mb-3">Question {qIndex + 1}</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={q.type}
                                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="open_ended">Open Ended</option>
                                    <option value="true_false">True/False</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bloom's Level</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={q.bloom_level}
                                    onChange={(e) => updateQuestion(qIndex, 'bloom_level', e.target.value)}
                                >
                                    <option>Remember</option>
                                    <option>Understand</option>
                                    <option>Apply</option>
                                    <option>Analyze</option>
                                    <option>Evaluate</option>
                                    <option>Create</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Question Text</label>
                            <textarea
                                className="w-full p-2 border rounded"
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                            />
                        </div>

                        {q.type === 'multiple_choice' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Options (Check the correct answer)</label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={Number(q.correct_answer) === oIndex}
                                            onChange={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border rounded"
                                            value={opt}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4">
                <button
                    onClick={addQuestion}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                    + Add Question
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    Save Assessment
                </button>
            </div>
        </div>
    );
}
