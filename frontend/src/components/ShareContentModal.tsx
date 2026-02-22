'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { X, User as UserIcon, Calendar, MessageSquare, Send, CheckCircle2, Search, Users } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface User {
    id: string;
    _id: string;
    email: string;
    full_name?: string;
}

interface ShareContentModalProps {
    contentId: string;
    contentTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ShareContentModal({
    contentId,
    contentTitle,
    isOpen,
    onClose,
    onSuccess
}: ShareContentModalProps) {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [description, setDescription] = useState('Please review this content');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            fetchUsers();
        }
    }, [isOpen, token]);

    const fetchUsers = async () => {
        try {
            // Fetch organization users
            const data = await api.get('/organizations/members', token!);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load team members');
        }
    };

    const handleToggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) {
            setError('Please select at least one team member');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post(`/generic/content/${contentId}/share`, {
                user_ids: selectedUsers,
                message: description,
                due_date: dueDate || null
            }, token!);

            alert(`Tasks successfully created for ${selectedUsers.length} team member(s)!`);
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Failed to share content:', err);
            setError(err.message || 'Failed to create tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUsers([]);
        setDescription('Please review this content');
        setDueDate('');
        setError(null);
        setSearchQuery('');
        onClose();
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4 animate-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <Send className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Review Tasks</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5 max-w-[400px] truncate">
                                {contentTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                            <X className="w-5 h-5" />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    {/* Team Members Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <Users className="w-3.5 h-3.5" />
                                Assign Team Members
                            </label>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {selectedUsers.length} Selected
                            </span>
                        </div>

                        {/* Search Box */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search members by name or email..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all text-sm outline-none font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {users.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                                    No team members found
                                </div>
                            ) : (
                                filteredUsers.map(user => {
                                    const userId = user.id || user._id;
                                    const isSelected = selectedUsers.includes(userId);
                                    return (
                                        <button
                                            key={userId}
                                            onClick={() => handleToggleUser(userId)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isSelected
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100'
                                                : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="relative">
                                                <UserAvatar name={user.full_name || user.email} size="sm" />
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm border border-white">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className={`text-xs font-black truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {user.full_name || user.email}
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate font-medium">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Description */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Task Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Instructions for the reviewers..."
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all text-sm outline-none font-medium resize-none"
                            />
                        </div>

                        {/* Due Date */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <Calendar className="w-3.5 h-3.5" />
                                Final Deadline
                            </label>
                            <div className="relative group">
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all text-sm outline-none font-medium appearance-none"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <ClockIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] leading-relaxed text-amber-700 font-bold">
                                    Tip: The task will automatically be created in the "To Do" stage with a "Medium" priority.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <UserIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Assigner: {loading ? '...' : (user?.full_name || user?.email || 'System Automator')}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-6 py-3 text-sm font-black text-slate-500 hover:text-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={loading || selectedUsers.length === 0}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Tasks ({selectedUsers.length})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
