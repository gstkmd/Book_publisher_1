'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Create form data for OAuth2 password flow
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const res = await api.post('/auth/access-token', formData, undefined, true);
            login(res.access_token);
        } catch (err: any) {
            console.error(err);
            // Try to extract detailed error from API
            let errorMessage = 'Invalid email or password';
            try {
                // If it's a string, it might be the error body from api.ts (e.g., "400: {...}")
                if (typeof err.message === 'string' && err.message.includes(':')) {
                    const jsonStr = err.message.split(':').slice(1).join(':').trim();
                    const detail = JSON.parse(jsonStr).detail;
                    if (detail) errorMessage = detail;
                }
            } catch (innerErr) {
                console.error("Failed to parse error detail", innerErr);
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                <Link href="/" className="mb-12 flex items-center justify-center gap-2 group">
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
                        CP
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Connect Publisher</span>
                </Link>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Welcome Back</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Enter your credentials to enter workspace</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                                placeholder="jane@company.com"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
                        >
                            Sign In to Platform
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            New here? <Link href="/signup" className="text-indigo-600 hover:scale-105 transition-transform inline-block">Create an account</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center animate-pulse">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors">
                      ← Back to home
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.1); }
                }
                .animate-pulse {
                    animation: pulse 4s ease-in-out infinite;
                }
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
