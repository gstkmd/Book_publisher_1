'use client';

import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { useAuth } from '@/context/AuthContext';
import {
    History, MessageSquare,
    Image as ImageIcon
} from 'lucide-react';

import { VersionHistory, Version } from './VersionHistory';
import { CommentsSidebar } from './CommentsSidebar';
import { DiffViewer } from './DiffViewer';
import { RichTextEditor } from './RichTextEditor';

interface CollaborativeEditorProps {
    documentId: string;
    initialContent?: string;
    onChange?: (content: string) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ documentId, initialContent, onChange }) => {
    const { token } = useAuth();
    const { messages, sendMessage } = useCollaboration(documentId);
    const [showHistory, setShowHistory] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [compareVersion, setCompareVersion] = useState<Version | null>(null);
    const [localContent, setLocalContent] = useState(initialContent || '');

    // Handle editor updates
    const handleEditorChange = (html: string) => {
        setLocalContent(html);
        sendMessage(html);
        if (onChange) onChange(html);
    };

    // Handle incoming collaboration messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // In a real app with TipTap, you'd use Yjs for better sync
            // For now we just keep local state updated if someone else changes it
            // but we avoid infinite loops or overwriting current typing
            // To simplify, we'll just let the local editor handle its own state
        }
    }, [messages]);

    const handleRestore = () => {
        console.log("Content restored");
        setCompareVersion(null);
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
                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Editor</h2>
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
                        <MessageSquare className={`w-4 h-4 transition-transform group-hover:scale-110 ${showComments ? 'text-indigo-100' : 'text-gray-400'}`} />
                        {showComments ? 'Comments Active' : 'Show Comments'}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`group flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all duration-300 border ${showHistory
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        <History className={`w-4 h-4 transition-transform group-hover:rotate-180 ${showHistory ? 'text-indigo-100' : 'text-gray-400'}`} />
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
                                    <DiffViewer oldText={compareVersion.body} newText={localContent} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <RichTextEditor
                                    content={localContent}
                                    onChange={handleEditorChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebars */}
                <div className={`flex transition-all duration-500 ease-in-out ${showComments || showHistory ? 'w-[400px]' : 'w-0'}`}>
                    {showComments && (
                        <div className="w-full h-full bg-white shadow-2xl overflow-hidden">
                            <CommentsSidebar documentId={documentId} wsMessages={messages} />
                        </div>
                    )}
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
