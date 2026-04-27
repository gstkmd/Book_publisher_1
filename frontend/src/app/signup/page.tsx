'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';

type Step = 1 | 2;

export default function SignupPage() {
    const { login } = useAuth();
    const router = useRouter();

    // Step 1 fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 2 fields
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');

    const [step, setStep] = useState<Step>(1);
    const [error, setError] = useState('');
    const [accountExistsError, setAccountExistsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const toSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const handleOrgNameChange = (val: string) => {
        setOrgName(val);
        setOrgSlug(toSlug(val));
    };

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAccountExistsError(false);
        if (!fullName.trim() || !email.trim() || password.length < 6) {
            setError('Please fill all fields. Password must be at least 6 characters.');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAccountExistsError(false);
        if (!orgName.trim() || !orgSlug.trim()) {
            setError('Please provide an organization name.');
            return;
        }
        setLoading(true);
        try {
            let userExisted = false;
            // 1. Try to create user account
            try {
                await api.post('/users/', { email, password, full_name: fullName, role: 'admin' });
            } catch (err: any) {
                let msg = '';
                try { const j = JSON.parse(err.message); msg = j.detail || msg; } catch { msg = err.message || msg; }
                if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
                    userExisted = true;
                } else {
                    throw err; // rethrow other errors
                }
            }

	   // 2. Login to get token
	   const params = new URLSearchParams() ;
           params.append('username', email);
           params.append('password', password);

           const loginRes = await fetch(
           	`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/access-token`,
    		{
        		method: 'POST',
        		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        		body: params.toString(),
    		}
);

		if (!loginRes.ok) {
            if (userExisted) {
                setAccountExistsError(true);
                throw new Error('Account already exists. Please login.');
            }
            throw new Error('Auto-login failed');
        }
		const { access_token } = await loginRes.json();

            // 3. Create organization
            try {
                await api.post('/organizations/', { name: orgName, slug: orgSlug }, access_token);
            } catch (orgErr: any) {
                console.warn('Organization creation warning:', orgErr);
            }

            // 4. Login via context (redirect to dashboard)
            login(access_token);
        } catch (err: any) {
            let msg = 'Registration failed';
            try { const j = JSON.parse(err.message); msg = j.detail || msg; } catch { msg = err.message || msg; }
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {/* Brand */}
                <Link href="/" className="mb-10 flex items-center justify-center gap-2 group">
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
                        CP
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Connect Publisher</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                      Get Started Free
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Build your publishing empire</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-600 shadow-sm shadow-indigo-500/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-600 shadow-sm shadow-indigo-500/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest text-center animate-shake">
                            {error}
                            {accountExistsError && (
                                <Link href="/login" className="block mt-2 text-indigo-600 hover:underline">
                                    Login instead →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* ── Step 1: Personal Details ── */}
                    {step === 1 && (
                        <form onSubmit={handleStep1} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Full Name</label>
                                <input
                                    type="text" required autoFocus
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="Jane Smith"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Work Email</label>
                                <input
                                    type="email" required
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="jane@company.com"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'} required minLength={6}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">
                                Next Step <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {/* ── Step 2: Organization Setup ── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-5 text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-800/50">
                                🏢 You will be the account administrator.
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Organization Name</label>
                                <input
                                    type="text" required autoFocus
                                    value={orgName} onChange={e => handleOrgNameChange(e.target.value)}
                                    placeholder="Book Magic Publishing"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Workspace URL</label>
                                <div className="flex items-center gap-2 group">
                                    <input
                                        type="text" required
                                        value={orgSlug} onChange={e => setOrgSlug(toSlug(e.target.value))}
                                        placeholder="book-magic"
                                        className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-sm font-mono font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setStep(1)}
                                    className="px-6 py-5 border-2 border-slate-100 dark:border-slate-800 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                                    <ArrowLeft className="w-5 h-5 mx-auto" />
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? 'Creating...' : <>Launch Workspace <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Already have an account? <Link href="/login" className="text-indigo-600 hover:scale-105 transition-transform inline-block">Login</Link>
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Joining via invite? <Link href="/join" className="text-indigo-600/50 hover:text-indigo-600 transition-colors">Use your link</Link>
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
