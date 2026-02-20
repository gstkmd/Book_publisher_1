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
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Editing: {documentId}</h2>
                    {compareVersion && (
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse border border-yellow-200">
                            Comparing with Version {compareVersion.version_number}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`text-sm border px-3 py-1 rounded hover:bg-gray-100 ${showComments ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                        {showComments ? 'Hide Comments' : 'Show Comments'}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`text-sm border px-3 py-1 rounded hover:bg-gray-100 ${showHistory ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                        {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Editor Section */}
                <div className="flex-1 flex flex-col border rounded-lg p-4 bg-white shadow-sm overflow-hidden">
                    {compareVersion ? (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-500 italic">Visual Diff (Red = Removed, Green = Added)</span>
                                <button
                                    onClick={() => setCompareVersion(null)}
                                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                                >
                                    Close Comparison
                                </button>
                            </div>
                            <DiffViewer oldText={compareVersion.body} newText={content} />
                        </div>
                    ) : (
                        <textarea
                            className="flex-1 w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={content}
                            onChange={handleChange}
                            placeholder="Start writing..."
                        />
                    )}
                </div>

                {/* Collaboration Log Section */}
                {!showComments && !showHistory && (
                    <div className="w-60 flex flex-col border rounded-lg bg-gray-50 shadow-sm shrink-0">
                        <h3 className="text-lg font-semibold p-4 border-b bg-gray-100">Live Updates</h3>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No activity yet...</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className="bg-white p-2 rounded border text-sm shadow-sm">
                                        {msg}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Comments Sidebar */}
                {showComments && (
                    <div className="shrink-0 h-full">
                        <CommentsSidebar documentId={documentId} wsMessages={messages} />
                    </div>
                )}

                {/* Version History Sidebar */}
                {showHistory && (
                    <div className="shrink-0 h-full">
                        <VersionHistory contentId={documentId} onRestore={handleRestore} onCompare={handleCompare} />
                    </div>
                )}
            </div>
        </div>
    );
};
