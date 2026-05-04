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
        <div className="flex flex-wrap items-center gap-1 p-3 bg-indigo-50/50 border-b border-indigo-100 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-0.5 mr-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('bold') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('italic') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('strike') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('code') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
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
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('blockquote') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
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
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('bulletList') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-xl hover:bg-white hover:shadow-md hover:scale-110 transition-all ${editor.isActive('orderedList') ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-400'}`}
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
                class: 'tiptap prose prose-indigo focus:outline-none max-w-none p-8 min-h-[600px] bg-white custom-scrollbar rounded-b-[2rem] border-none',
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
        <div className="flex flex-col overflow-hidden transition-all">
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
