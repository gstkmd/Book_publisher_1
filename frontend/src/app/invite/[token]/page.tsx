'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TeamService } from '@/lib/services/TeamService';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const { token: authToken, login, user: currentUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [inviteData, setInviteData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Auth forms state
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [authError, setAuthError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!token) return;
        TeamService.validateInvite(token)
            .then(data => {
                setInviteData(data);
                setError(null);
            })
            .catch(err => {
                // Parse error safely
                let msg = 'Invalid or expired invite';
                try { msg = JSON.parse(err.message).detail || msg; } catch { }
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleAcceptInvite = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setAuthError('');
        setIsProcessing(true);

        try {
            let activeToken = authToken;

            // If not logged in, we need to authenticate first
            if (!activeToken) {
                if (isLoginMode) {
                    const formData = new URLSearchParams();
                    formData.append('username', inviteData.email);
                    formData.append('password', password);
                    const res = await api.post('/auth/access-token', formData, undefined, true);
                    activeToken = res.access_token;
                    login(res.access_token);
                } else {
                    const res = await api.post('/users/', {
                        email: inviteData.email,
                        password,
                        full_name: fullName
                    });
                    // After signup, login to get token
                    const formData = new URLSearchParams();
                    formData.append('username', inviteData.email);
                    formData.append('password', password);
                    const authRes = await api.post('/auth/access-token', formData, undefined, true);
                    activeToken = authRes.access_token;
                    login(authRes.access_token);
                }
            }

            // Accept the invitation
            await TeamService.acceptInvite(token, activeToken!);
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            let msg = 'Processing failed';
            try { msg = JSON.parse(err.message).detail || msg; } catch { }
            if (typeof err.message === 'string' && !err.message.includes('{')) {
                msg = err.message;
            }
            setAuthError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        exportErrorPage(error);
    }

    function exportErrorPage(msg: string) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-red-100">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Invitation Invalid</h2>
                    <p className="text-slate-500 mb-6">{msg}</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-slate-900 text-white font-bold rounded-xl transition hover:bg-slate-800">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    if (error) return exportErrorPage(error);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background decors */}
            <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-blue-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Join <span className="text-indigo-600">{inviteData.org_name}</span></h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        You've been invited to join as <span className="font-bold capitalize text-slate-700">{inviteData.role.replace('_', ' ')}</span>.
                    </p>
                    <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-medium text-slate-600 border border-slate-200">
                        {inviteData.email}
                    </div>
                </div>

                {authError && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{authError}</span>
                    </div>
                )}

                {authToken ? (
                    // Logged in
                    <div className="text-center">
                        <p className="text-sm text-slate-600 mb-6">
                            You are signed in as <span className="font-bold">{currentUser?.email}</span>.
                        </p>
                        {currentUser?.email !== inviteData.email ? (
                            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100 mb-6 font-medium">
                                This invitation is for <b>{inviteData.email}</b>, but you are logged in as <b>{currentUser?.email}</b>. Please switch accounts.
                            </div>
                        ) : (
                            <button
                                onClick={() => handleAcceptInvite()}
                                disabled={isProcessing}
                                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
                            >
                                {isProcessing ? 'Accepting...' : 'Accept Invitation'}
                            </button>
                        )}
                    </div>
                ) : (
                    // Not logged in
                    <form onSubmit={handleAcceptInvite} className="space-y-4">
                        {!isLoginMode && (
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input
                                    type="text" required
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm font-medium"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                            <input
                                type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm font-medium"
                            />
                        </div>

                        <button
                            type="submit" disabled={isProcessing}
                            className="w-full py-3.5 mt-2 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
                        >
                            {isProcessing ? 'Processing...' : (isLoginMode ? 'Sign In & Accept' : 'Create Account & Accept')}
                        </button>

                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }}
                                className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition"
                            >
                                {isLoginMode ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
