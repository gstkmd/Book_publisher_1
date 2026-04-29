'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Missing reset token. Please request a new link.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password/', { token, new_password: password });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError('The reset link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !success) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-red-900 uppercase tracking-tighter">Invalid Link</h3>
                <p className="text-sm font-medium text-red-600 mt-2">This password reset link is missing its security token.</p>
                <Link href="/login/forgot-password" title="Request new link" className="mt-6 inline-block text-xs font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900">Request New Link</Link>
            </div>
        );
    }

    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 w-full max-w-md">
            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black mx-auto mb-6 shadow-lg shadow-indigo-200">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Set New Password</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Choose a strong, unique password for your account
                </p>
            </div>

            {success ? (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl flex flex-col items-center text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                        <p className="text-lg font-black text-emerald-900 uppercase tracking-tight">Security Updated</p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">Your password has been changed. Redirecting to login...</p>
                    </div>
                    <Link 
                        href="/login"
                        className="w-full flex items-center justify-center py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-lg"
                    >
                        Sign In Now
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"} required
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold pr-12"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"} required
                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Confirm Password Change"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen bg-slate-50 items-center justify-center p-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[100px] animate-pulse"></div>

            <div className="w-full max-w-md relative z-10">
                <Suspense fallback={<div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm font-black uppercase tracking-widest text-[10px] text-slate-400">Loading Secure Session...</div>}>
                    <ResetPasswordForm />
                </Suspense>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                        Connect Publisher Identity Service
                    </p>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
}
