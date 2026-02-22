'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Building2, Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    editor_in_chief: 'Editor-in-Chief',
    section_editor: 'Section Editor',
    author: 'Author',
    reviewer: 'Reviewer',
    illustrator: 'Illustrator',
    teacher: 'Teacher',
    user: 'Member',
};

function JoinPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';

    const [invite, setInvite] = useState<{ email: string; role: string; org_name: string } | null>(null);
    const [tokenError, setTokenError] = useState('');
    const [loading, setLoading] = useState(true);

    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setTokenError('No invite token found in the URL.');
            setLoading(false);
            return;
        }
        api.get(`/organizations/invite/${token}`)
            .then(data => { setInvite(data); setLoading(false); })
            .catch(err => {
                let msg = 'Invalid or expired invite link.';
                try { msg = JSON.parse(err.message).detail || msg; } catch { }
                setTokenError(msg);
                setLoading(false);
            });
    }, [token]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        if (password.length < 6) { setSubmitError('Password must be at least 6 characters.'); return; }
        setSubmitting(true);
        try {
            await api.post('/organizations/join', { token, full_name: fullName, password });
            setSuccess(true);
        } catch (err: any) {
            let msg = 'Failed to join. Please try again.';
            try { msg = JSON.parse(err.message).detail || msg; } catch { msg = err.message || msg; }
            setSubmitError(msg);
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        You're Invited!
                    </span>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-medium">Validating your invite…</p>
                        </div>
                    )}

                    {/* Token Error */}
                    {!loading && tokenError && (
                        <div className="text-center py-8">
                            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h3 className="font-black text-slate-900 text-lg mb-2">Invite Invalid</h3>
                            <p className="text-slate-500 text-sm mb-6">{tokenError}</p>
                            <Link href="/login" className="text-indigo-600 font-bold hover:underline text-sm">Go to Login →</Link>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="font-black text-slate-900 text-lg mb-2">Welcome aboard! 🎉</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                You've joined <strong>{invite?.org_name}</strong>. Log in to get started.
                            </p>
                            <Link href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200">
                                Go to Login →
                            </Link>
                        </div>
                    )}

                    {/* Join Form */}
                    {!loading && !tokenError && !success && invite && (
                        <>
                            {/* Org + Role Badge */}
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl mb-6 border border-indigo-100">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate">{invite.org_name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Shield className="w-3 h-3 text-indigo-500" />
                                        <span className="text-xs font-bold text-indigo-600">
                                            {ROLE_LABELS[invite.role] || invite.role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{invite.email}</p>
                                </div>
                            </div>

                            {submitError && (
                                <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-5 text-sm font-medium">
                                    {submitError}
                                </div>
                            )}

                            <form onSubmit={handleJoin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Your Full Name</label>
                                    <input
                                        type="text" required autoFocus
                                        value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Jane Smith"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Create Password</label>
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

                                <button type="submit" disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                                    {submitting ? 'Joining…' : `Join ${invite.org_name}`}
                                </button>
                            </form>

                            <p className="mt-5 text-center text-xs text-slate-400">
                                Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Log in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <JoinPageContent />
        </Suspense>
    );
}
