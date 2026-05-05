'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, setUnauthorizedHandler } from '../lib/api';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'super_admin' | 'editor_in_chief' | 'section_editor' | 'author' | 'reviewer' | 'illustrator' | 'teacher' | 'user';
    organization_id?: string;
}

interface Org {
    id: string;
    name: string;
    slug: string;
    plan?: string;
    enabled_modules?: string[];
    hide_disabled_features?: boolean;
    role_permissions?: Record<string, string[]>;
}

interface AuthContextType {
    user: User | null;
    org: Org | null;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    activeStatus: any;
    refreshActiveStatus: () => Promise<void>;
    impersonateOrganization: (orgId: string) => Promise<void>;
    exitOrganizationContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [org, setOrg] = useState<Org | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTwoHourWorkCheck, setShowTwoHourWorkCheck] = useState<{ taskId: string, taskTitle: string } | null>(null);
    const [activeStatus, setActiveStatus] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();
    const instanceId = useState(() => Math.random().toString(36).substring(7))[0];
    const isLoggingOut = useRef(false);

    // Register global unauthorized handler once
    useEffect(() => {
        setUnauthorizedHandler(() => {
            if (!isLoggingOut.current) {
                console.warn(`[AUTH-${instanceId}] 🛑 Global unauthorized trigger, logging out...`);
                logout();
            }
        });
    }, []);

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
                    // Fetch org after user is loaded
                    if (userData.organization_id) {
                        api.get('/organizations/me', storedToken)
                            .then((orgData) => { if (orgData) setOrg(orgData); })
                            .catch(() => { });
                    }
                })
                .catch((err) => {
                    console.error(`[AUTH-${instanceId}] ❌ User profile fetch failed:`, err);
                    // logout() will be called by handleResponse in api.ts if it's 401/403
                    // but we call it here as well for other types of errors during init
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

    const login = async (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsLoading(true); // Re-enter loading state while fetching profile
        
        try {
            console.log(`[AUTH-${instanceId}] 🚀 Login initiated, fetching user profile...`);
            const userData = await api.get('/users/me', newToken);
            setUser(userData);
            
            if (userData.organization_id) {
                try {
                    const orgData = await api.get('/organizations/me', newToken);
                    if (orgData) setOrg(orgData);
                } catch (orgErr) {
                    console.warn(`[AUTH-${instanceId}] ⚠️ Failed to fetch org during login:`, orgErr);
                }
            }
            
            console.log(`[AUTH-${instanceId}] ✅ Login complete, redirecting to dashboard`);
            router.push('/dashboard');
        } catch (err: any) {
            console.error(`[AUTH-${instanceId}] ❌ Profile fetch failed during login:`, err);
            
            let errorMessage = "Failed to load user profile.";
            if (err.message) {
                // api.ts returns error message as "status: body"
                errorMessage = `Login error: ${err.message}`;
            }
            
            toast.error(errorMessage);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        if (isLoggingOut.current) return;
        isLoggingOut.current = true;

        console.log(`[AUTH-${instanceId}] 🚪 Logging out...`);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setOrg(null);
        router.push('/login');
        
        // Reset the flag after a short delay to allow future logins
        setTimeout(() => {
            isLoggingOut.current = false;
        }, 1000);
    };

    // Global Task Monitor - Checks every 1 hour if user has an active task
    useEffect(() => {
        if (!token || !user) return;

        const checkActiveStatus = async () => {
            try {
                if (user.role === 'admin') return;
                const status = await api.get('/generic/tasks/active-status', token);
                setActiveStatus(status);

                if (status.active_count === 0) {
                    // Skip showing the toast if the user is on an auth page or the home page
                    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/';
                    if (isAuthPage) return;

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
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => {
                                                router.push('/dashboard/tasks');
                                                toast.dismiss(t.id);
                                            }}
                                            className="px-3 py-1.5 bg-white text-red-600 rounded-md text-xs font-black shadow-sm hover:bg-gray-50 transition-colors"
                                        >
                                            CHOOSE TASK
                                        </button>
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            className="px-3 py-1.5 bg-transparent border border-white/40 text-white rounded-md text-xs font-black hover:bg-white/10 transition-colors"
                                        >
                                            DISMISS
                                        </button>
                                    </div>
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
                } else if (status.active_count === 1 && status.active_task_timer_start) {
                    // Check for 2-hour continuous work
                    const timerStart = new Date(status.active_task_timer_start);
                    const serverTime = new Date(status.server_time);
                    const diffHrs = (serverTime.getTime() - timerStart.getTime()) / 3600000;

                    if (diffHrs >= 2) {
                        setShowTwoHourWorkCheck({
                            taskId: status.active_task_id,
                            taskTitle: status.active_task_title
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to check active task status:", err);
            }
        };

        const interval = setInterval(checkActiveStatus, 3600000); // 1 hour
        const timeout = setTimeout(checkActiveStatus, 10000); // Check 10s after login/mount

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [token, user, router, pathname]);

    const refreshActiveStatus = async () => {
        if (!token || !user) return;
        try {
            const status = await api.get('/generic/tasks/active-status', token);
            setActiveStatus(status);
        } catch (err) {
            console.error("Failed to refresh active status:", err);
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, stage: string) => {
        // Optimistically close popup
        setShowTwoHourWorkCheck(null);

        try {
            const updates: any = { stage };
            if (stage === 'Done') {
                updates.status = 'completed';
            }

            await api.put(`/generic/tasks/${taskId}`, updates, token!);
            await refreshActiveStatus();
            toast.success(`Task moved to ${stage}`);
        } catch (err) {
            console.error("Failed to update task status:", err);
            toast.error("Failed to update task status");
            // Re-open check or refresh status if failed? 
            // For now, refreshing status is safer
            await refreshActiveStatus();
        }
    };

    const impersonateOrganization = async (orgId: string) => {
        if (!token) return;
        try {
            await api.post(`/superadmin/impersonate/${orgId}`, {}, token);
            // Re-fetch everything to update the context
            const userData = await api.get('/users/me', token);
            setUser(userData);
            if (userData.organization_id) {
                const orgData = await api.get('/organizations/me', token);
                setOrg(orgData);
            }
            toast.success("Organization context switched!");
            router.push('/dashboard');
        } catch (err) {
            console.error("Impersonation failed:", err);
            toast.error("Failed to switch organization");
        }
    };

    const exitOrganizationContext = async () => {
        if (!token) return;
        try {
            await api.post('/superadmin/exit-context', {}, token);
            // Re-fetch user to update organization_id and clear org state
            const userData = await api.get('/users/me', token);
            setUser(userData);
            setOrg(null);
            toast.success("Exited organization context");
            router.push('/dashboard');
        } catch (err) {
            console.error("Failed to exit context:", err);
            toast.error("Failed to exit context");
        }
    };

    return (
        <AuthContext.Provider value={{ user, org, token, login, logout, isLoading, activeStatus, refreshActiveStatus, impersonateOrganization, exitOrganizationContext }}>
            {children}

            {/* 2-Hour Continuous Work Confirmation Modal */}
            {showTwoHourWorkCheck && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 text-center text-slate-900">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 border-4 border-indigo-100">
                                <AlertCircle className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-3">Still Working?</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                                You've been working on <span className="font-black text-slate-900 italic">"{showTwoHourWorkCheck.taskTitle}"</span> for over 2 hours.
                                <br />Are you still actively working on this task?
                            </p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowTwoHourWorkCheck(null)}
                                        className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold"
                                    >
                                        YES, STILL WORKING
                                    </button>
                                    <div className="relative group">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleUpdateTaskStatus(showTwoHourWorkCheck.taskId, e.target.value);
                                                }
                                            }}
                                            className="w-full px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all appearance-none cursor-pointer text-center outline-none font-bold"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>NO, UPDATE STATUS</option>
                                            <option value="Done" className="font-bold">DONE</option>
                                            <option value="Review" className="font-bold">REVIEW</option>
                                            <option value="To Do" className="font-bold">TO DO / PAUSE</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
