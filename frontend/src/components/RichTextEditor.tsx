'use client';

import React, { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
    Bold, Italic, List, ListOrdered,
    Image as ImageIcon
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor, onImageUpload }: { editor: any, onImageUpload: () => void }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-100 rounded-t-lg">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bold') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('italic') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <Italic className="w-4 h-4" />
            </button>
            <div className="w-[1px] bg-gray-200 mx-1 self-stretch" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-[1px] bg-gray-200 mx-1 self-stretch" />
            <button
                type="button"
                onClick={onImageUpload}
                className="p-2 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500"
            >
                <ImageIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl max-w-full h-auto border-4 border-white shadow-lg my-6',
                },
            }),
        ],
        content: content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-indigo focus:outline-none max-w-none p-4 min-h-[200px] bg-white custom-scrollbar rounded-b-lg border border-t-0 border-gray-100',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const handleImageTrigger = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/generic/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            if (data.url && editor) {
                editor.chain().focus().setImage({ src: data.url }).run();
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('Failed to upload image. Please check your connection.');
        }
    };

    return (
        <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <MenuBar editor={editor} onImageUpload={handleImageTrigger} />
            <EditorContent editor={editor} />
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};
