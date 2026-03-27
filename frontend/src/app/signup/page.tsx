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
           	`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/login/access-token`,
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex flex-col items-center justify-center p-6">
            {/* Back link */}
            <Link href="/" className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Get Started Free
                    </span>
                    <p className="text-slate-500 text-sm mt-2">Create your organization workspace in 2 steps</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className={`flex-1 flex items-center gap-2 p-3 rounded-xl transition-all ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${step > 1 ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>
                            {step > 1 ? <Check className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Your Details</span>
                    </div>
                    <div className="w-4 h-0.5 bg-slate-200 shrink-0" />
                    <div className={`flex-1 flex items-center gap-2 p-3 rounded-xl transition-all ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Your Org</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-6 text-sm font-medium flex flex-col gap-3">
                            <div>{error}</div>
                            {accountExistsError && (
                                <Link href="/login" className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-colors w-fit shadow-sm">
                                    Go to Login <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* ── Step 1: Personal Details ── */}
                    {step === 1 && (
                        <form onSubmit={handleStep1} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text" required autoFocus
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="Jane Smith"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Work Email</label>
                                <input
                                    type="email" required
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="jane@company.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'} required minLength={6}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {/* ── Step 2: Organization Setup ── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-700 font-medium border border-indigo-100">
                                🏢 You'll be the <strong>Admin</strong> of your organization and can invite team members from Settings.
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Organization Name</label>
                                <input
                                    type="text" required autoFocus
                                    value={orgName} onChange={e => handleOrgNameChange(e.target.value)}
                                    placeholder="Book Magic Publishing"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                {orgSlug && (
                                    <p className="text-xs text-slate-400 mt-1.5 font-mono">
                                        URL: <span className="text-indigo-500 font-bold">{orgSlug}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Slug (customizable)</label>
                                <input
                                    type="text" required
                                    value={orgSlug} onChange={e => setOrgSlug(toSlug(e.target.value))}
                                    placeholder="book-magic"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)}
                                    className="flex items-center gap-2 px-5 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-50 transition-all">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                                    {loading ? 'Creating workspace...' : <>Launch Workspace <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Log in</Link>
                    </p>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        Joining via invite? <Link href="/join" className="text-indigo-600 font-bold hover:underline">Use your link</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
