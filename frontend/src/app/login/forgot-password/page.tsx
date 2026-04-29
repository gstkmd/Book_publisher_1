'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(`/auth/password-recovery/${encodeURIComponent(email)}`, {});
            setSent(true);
        } catch (err: any) {
            setError('Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 items-center justify-center p-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[100px] animate-pulse"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black mx-auto mb-6 shadow-lg shadow-indigo-200">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Recover Access</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                            {sent ? "Check your inbox for instructions" : "Enter your email to receive a reset link"}
                        </p>
                    </div>

                    {sent ? (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex flex-col items-center text-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                                <p className="text-sm font-bold text-emerald-800">Email Dispatched Successfully!</p>
                                <p className="text-[10px] text-emerald-600 uppercase tracking-widest mt-1 font-black">Please check your spam folder too</p>
                            </div>
                            <Link 
                                href="/login"
                                className="w-full flex items-center justify-center py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-lg"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {error && (
                                <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Registered Email</label>
                                <div className="relative">
                                    <input
                                        type="email" required
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="jane@company.com"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold pl-12"
                                    />
                                    <Mail className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>

                            <div className="text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">
                                    <ArrowLeft className="w-3 h-3" />
                                    Remember your password?
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                        Connect Publisher Identity Service
                    </p>
                </div>
            </div>
        </div>
    );
}
