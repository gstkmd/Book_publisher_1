'use client';

import React, { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
    Bold, Italic, List, ListOrdered,
    Image as ImageIcon, Strikethrough, Code,
    Quote, Heading1, Heading2, Minus,
    Undo, Redo, Type
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor, onImageUpload }: { editor: any, onImageUpload: () => void }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
            <div className="flex items-center gap-0.5 mr-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bold') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('italic') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('strike') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('code') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('blockquote') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Blockquote"
                >
                    <Quote className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-500'}`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500"
                    title="Horizontal Rule"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={onImageUpload}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500"
                    title="Insert Image"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-0.5 ml-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500 disabled:opacity-30"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-500 disabled:opacity-30"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>
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
                class: 'tiptap prose prose-indigo focus:outline-none max-w-none p-4 min-h-[200px] bg-white custom-scrollbar rounded-b-lg border border-t-0 border-gray-100',
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

            const data = await api.post('/generic/upload', formData, token, true);

            if (data.url && editor) {
                editor.chain().focus().setImage({ src: data.url }).run();
            }
        } catch (err: any) {
            console.error('Image upload failed:', err);
            alert(`Failed to upload image: ${err.message || 'Unknown error'}. Please check your connection and login status.`);
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
