'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { IntegrityService, IntegrityReport } from '@/lib/services/IntegrityService';

interface RichTextEditorProps {
    initialValue?: any;
    onChange?: (value: any) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onChange }) => {
    const [jsonContent, setJsonContent] = useState<string>(
        JSON.stringify(initialValue || { type: 'doc', content: [] }, null, 2)
    );
    const [uploading, setUploading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [selection, setSelection] = useState({ text: '', start: 0, end: 0 });
    const [showOptions, setShowOptions] = useState(false);
    const [options, setOptions] = useState({ checkAI: true, checkCopyright: true });
    const [lastReport, setLastReport] = useState<IntegrityReport | null>(null);
    const { token } = useAuth();

    const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value.substring(start, end);

        if (text && text.trim().length > 10) {
            setSelection({ text, start, end });
            setShowOptions(true);
        } else {
            setShowOptions(false);
        }
    };

    const runIntegrityCheck = async () => {
        if (!token || !selection.text) return;
        setScanning(true);
        setLastReport(null);
        try {
            const report = await IntegrityService.checkPartial(selection.text, options, token);
            setLastReport(report);
        } catch (err) {
            console.error(err);
            alert('Integrity check failed');
        } finally {
            setScanning(false);
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setJsonContent(newValue);
        try {
            const parsed = JSON.parse(newValue);
            if (onChange) onChange(parsed);
        } catch (err) {
            // Invalid JSON, don't propagate change yet
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploading(true);

        try {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/generic/upload', formData, token || undefined, true);

            // Insert image logic (for now, just append to JSON)
            try {
                const current = JSON.parse(jsonContent);
                if (!current.content) current.content = [];
                current.content.push({
                    type: 'image',
                    attrs: { src: res.url, alt: file.name }
                });
                const newJson = JSON.stringify(current, null, 2);
                setJsonContent(newJson);
                if (onChange) onChange(current);
            } catch {
                alert('Could not insert image into invalid JSON structure');
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="mb-2 flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-gray-700">Rich Text (JSON Mode)</span>
                <label className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded cursor-pointer">
                    {uploading ? 'Uploading...' : 'Insert Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
            </div>

            <div className="relative">
                <textarea
                    className="w-full h-64 font-mono text-sm p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={jsonContent}
                    onChange={handleJsonChange}
                    onMouseUp={handleMouseUp}
                    placeholder='{"type": "doc", "content": []}'
                />

                {showOptions && (
                    <div className="absolute top-0 right-0 m-2 p-3 bg-white border shadow-xl rounded-lg z-20 w-64 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Integrity Scan</span>
                            <button onClick={() => setShowOptions(false)} className="text-gray-600 hover:text-gray-600">×</button>
                        </div>

                        <div className="space-y-2 mb-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={options.checkAI}
                                    onChange={(e) => setOptions({ ...options, checkAI: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">AI Detection</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={options.checkCopyright}
                                    onChange={(e) => setOptions({ ...options, checkCopyright: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">Copyright Check</span>
                            </label>
                        </div>

                        <button
                            onClick={runIntegrityCheck}
                            disabled={scanning || (!options.checkAI && !options.checkCopyright)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shadow-sm"
                        >
                            {scanning ? 'Analyzing Snippet...' : 'Scan Selection'}
                        </button>

                        {lastReport && (
                            <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-700">
                                <div className="font-bold mb-1 border-b pb-1">Result:</div>
                                {lastReport.ai_score !== null && (
                                    <div className="flex justify-between items-center mb-1">
                                        <span>AI Probability:</span>
                                        <span className={`font-mono font-bold ${lastReport.ai_score > 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(lastReport.ai_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                )}
                                {lastReport.plagiarism_matches !== null && (
                                    <div className="flex justify-between items-center">
                                        <span>Plagiarism:</span>
                                        <span className={`font-mono font-bold ${lastReport.plagiarism_matches.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {lastReport.plagiarism_matches.length > 0 ? `${lastReport.plagiarism_matches.length} matches` : 'Clean'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
                * This is a raw JSON editor simulating a ProseMirror document structure.
                Images uploaded are added as nodes.
            </p>
        </div>
    );
};
