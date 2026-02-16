'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
    const { token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [message, setMessage] = useState('Please review this content');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                message,
                due_date: dueDate || null
            }, token!);

            alert(`Content shared with ${selectedUsers.length} team member(s)!`);
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Failed to share content:', err);
            setError(err.message || 'Failed to share content');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUsers([]);
        setMessage('Please review this content');
        setDueDate('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Share Content</h2>
                            <p className="text-gray-600 mt-1">{contentTitle}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Team Members Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Select Team Members
                        </label>
                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            {users.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No team members found
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {users.map(user => {
                                        const userId = user.id || user._id;
                                        return (
                                            <label
                                                key={userId}
                                                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(userId)}
                                                    onChange={() => handleToggleUser(userId)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.full_name || user.email}
                                                    </div>
                                                    {user.full_name && (
                                                        <div className="text-xs text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {selectedUsers.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                                {selectedUsers.length} member(s) selected
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a message for the team members..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Due Date (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={loading || selectedUsers.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sharing...' : `Share with ${selectedUsers.length || 0} member(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
