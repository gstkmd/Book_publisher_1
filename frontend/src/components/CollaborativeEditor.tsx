'use client';

import React, { useState } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';

interface CollaborativeEditorProps {
    documentId: string;
}

import { VersionHistory, Version } from './VersionHistory';
import { CommentsSidebar } from './CommentsSidebar';
import { DiffViewer } from './DiffViewer';

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ documentId }) => {
    const { messages, sendMessage } = useCollaboration(documentId);
    const [content, setContent] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [compareVersion, setCompareVersion] = useState<Version | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setContent(newText);
        sendMessage(newText);
    };

    const handleRestore = () => {
        // Reload content logic would go here, for now just alerting
        console.log("Content restored, refresh editor content");
        setCompareVersion(null); // Close diff if open
    };

    const handleCompare = (version: Version | null) => {
        setCompareVersion(version);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50/50 rounded-2xl overflow-hidden border border-white shadow-2xl backdrop-blur-sm">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Document ID</h2>
                        <h3 className="text-xl font-black text-gray-900 leading-none">{documentId}</h3>
                    </div>
                    {compareVersion && (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black border border-amber-100 shadow-sm animate-pulse ml-4">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            COMPARING V{compareVersion.version_number}
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`group flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all duration-300 border ${showComments
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        <svg className={`w-4 h-4 transition-transform group-hover:scale-110 ${showComments ? 'text-indigo-100' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {showComments ? 'Comments Active' : 'Show Comments'}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`group flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all duration-300 border ${showHistory
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        <svg className={`w-4 h-4 transition-transform group-hover:rotate-180 ${showHistory ? 'text-indigo-100' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {showHistory ? 'History Open' : 'Version History'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-0 overflow-hidden bg-white/30">
                {/* Editor Section */}
                <div className="flex-1 flex flex-col p-6 transition-all duration-500">
                    <div className={`flex-1 flex flex-col relative rounded-2xl overflow-hidden bg-white shadow-inner border border-gray-100 ${compareVersion ? 'ring-4 ring-amber-50' : 'focus-within:ring-4 focus-within:ring-indigo-50 transition-all'}`}>
                        {compareVersion ? (
                            <div className="flex flex-col h-full bg-white">
                                <div className="flex justify-between items-center px-6 py-3 bg-amber-50/50 border-b border-amber-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Visual Differencing Engine</span>
                                    <button
                                        onClick={() => setCompareVersion(null)}
                                        className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-800 underline underline-offset-4"
                                    >
                                        Return to Editor
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <DiffViewer oldText={compareVersion.body} newText={content} />
                                </div>
                            </div>
                        ) : (
                            <textarea
                                className="flex-1 w-full p-8 text-lg font-serif leading-relaxed text-gray-800 bg-transparent resize-none focus:outline-none placeholder:italic placeholder:text-gray-300 custom-scrollbar"
                                value={content}
                                onChange={handleChange}
                                placeholder="Once upon a time..."
                            />
                        )}
                    </div>
                </div>

                {/* Vertical Separator */}
                {(showComments || showHistory) && <div className="w-[1px] bg-gradient-to-b from-transparent via-gray-200 to-transparent my-10" />}

                {/* Sidebars with Glassmorphism */}
                <div className={`flex transition-all duration-500 ease-in-out ${showComments || showHistory ? 'w-[400px]' : 'w-0'}`}>
                    {/* Collaboration Log (Only when sidebars closed) */}
                    {!showComments && !showHistory && (
                        <div className="w-72 flex flex-col border-l border-gray-100 bg-white/60 backdrop-blur-xl shadow-2xl">
                            <div className="p-6 border-b border-gray-100/50 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Live Stream</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Awaiting activity...</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div key={index} className="group relative bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                                            <div className="absolute -left-1 top-4 w-1 h-4 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <p className="text-xs text-gray-700 leading-relaxed">{msg}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comments Sidebar */}
                    {showComments && (
                        <div className="w-full h-full bg-white shadow-2xl overflow-hidden">
                            <CommentsSidebar documentId={documentId} wsMessages={messages} />
                        </div>
                    )}

                    {/* Version History Sidebar */}
                    {showHistory && (
                        <div className="w-full h-full bg-white shadow-2xl overflow-hidden">
                            <VersionHistory contentId={documentId} onRestore={handleRestore} onCompare={handleCompare} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
