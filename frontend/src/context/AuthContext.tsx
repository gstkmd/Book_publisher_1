'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'editor_in_chief' | 'section_editor' | 'author' | 'reviewer' | 'illustrator' | 'teacher' | 'user';
    organization_id?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [instanceId] = useState(() => Math.random().toString(36).substring(7));

    useEffect(() => {
        console.log(`[AUTH-${instanceId}] 🏗️ AuthProvider mounted`);
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            console.log(`[AUTH-${instanceId}] 🔑 Token found in localStorage, fetching user...`);
            setToken(storedToken);
            // Fetch user details - Using deduplicated api.get
            api.get('/users/me', storedToken)
                .then((userData) => {
                    console.log(`[AUTH-${instanceId}] ✅ User profile fetched for: ${userData.email}`);
                    setUser(userData);
                })
                .catch((err) => {
                    console.error(`[AUTH-${instanceId}] ❌ User profile fetch failed:`, err);
                    logout();
                })
                .finally(() => {
                    console.log(`[AUTH-${instanceId}] 🏁 Auth initialization complete`);
                    setIsLoading(false);
                });
        } else {
            console.log(`[AUTH-${instanceId}] 📭 No token found, auth initialization complete`);
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        api.get('/users/me', newToken).then((userData) => setUser(userData));
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    // Global Task Monitor - Checks every 1 hour if user has an active task
    useEffect(() => {
        if (!token || !user) return;

        const checkActiveTask = async () => {
            try {
                // Only monitor roles that typically perform tasks
                const taskRoles = ['admin', 'editor_in_chief', 'section_editor', 'author', 'reviewer', 'illustrator'];
                if (!taskRoles.includes(user.role)) return;

                const status = await api.get('/generic/tasks/active-status', token);
                if (status.active_count === 0) {
                    const lastActivityAt = status.last_activity_at ? new Date(status.last_activity_at) : null;
                    const serverTime = new Date(status.server_time);

                    const diffMins = lastActivityAt ? (serverTime.getTime() - lastActivityAt.getTime()) / 60000 : 999;

                    if (diffMins > 15) {
                        toast.error(
                            (t) => (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <AlertCircle className="w-5 h-5 text-white" />
                                        <span>No Active Task</span>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        You don't have any in-progress tasks. Please start a task to track your activity.
                                    </p>
                                    <button
                                        onClick={() => {
                                            router.push('/dashboard/tasks');
                                            toast.dismiss(t.id);
                                        }}
                                        className="mt-2 px-3 py-1.5 bg-white text-red-600 rounded-md text-xs font-black shadow-sm hover:bg-gray-50 transition-colors self-start"
                                    >
                                        CHOOSE TASK
                                    </button>
                                </div>
                            ),
                            {
                                duration: 15000,
                                id: 'no-active-task-warning',
                                style: {
                                    background: '#ef4444',
                                    color: '#fff',
                                    padding: '16px',
                                }
                            }
                        );
                    }
                }
            } catch (err) {
                console.error("Failed to check active task status:", err);
            }
        };

        const interval = setInterval(checkActiveTask, 3600000); // 1 hour
        const timeout = setTimeout(checkActiveTask, 10000); // Check 10s after login/mount

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [token, user, router]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
