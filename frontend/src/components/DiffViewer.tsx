'use client';

import React from 'react';
import { diffWords, DiffChange } from '@/lib/diff';

interface DiffViewerProps {
    oldText: string;
    newText: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
    const changes = diffWords(oldText, newText);

    return (
        <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed p-4 border rounded bg-white overflow-y-auto max-h-full">
            {changes.map((change, index) => {
                let className = '';
                if (change.added) {
                    className = 'bg-green-100 text-green-800 border-b-2 border-green-200';
                } else if (change.removed) {
                    className = 'bg-red-100 text-red-800 line-through border-b-2 border-red-200';
                }

                return (
                    <span key={index} className={className}>
                        {change.value}
                    </span>
                );
            })}
        </div>
    );
};
