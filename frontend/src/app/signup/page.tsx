'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';

type Step = 1 | 2;

export default function SignupPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [step, setStep] = useState<Step>(1);
    const [error, setError] = useState('');
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
        if (!fullName.trim() || !email.trim() || password.length < 6) {
            setError('Please fill all fields properly.');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/users/', { email, password, full_name: fullName, role: 'admin' });
            
            const params = new URLSearchParams();
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

    		if (!loginRes.ok) throw new Error('Auto-login failed');
    		const { access_token } = await loginRes.json();

            await api.post('/organizations/', { name: orgName, slug: orgSlug }, access_token);
            login(access_token);
        } catch (err: any) {
            setError('Registration failed. Email might already exist.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white relative overflow-hidden">
            {/* Promotion Section (visible on lg) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-50 flex-col justify-between p-16 relative border-r border-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-[100px]"></div>
                
                <div>
                  <Link href="/" className="inline-flex items-center gap-3 mb-24 cursor-pointer">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">CP</div>
                      <span className="text-2xl font-black uppercase tracking-tighter text-slate-900">Connect Publisher</span>
                  </Link>
                  <div className="max-w-md relative z-10">
                      <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter mb-6">
                        Join the <br/>Enterprise Cloud.
                      </h2>
                      <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">
                        Get started with the world's most advanced publishing workspace and explore our integrated apps.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                          {[
                            { id: 'CS', name: 'Compliance Sarthi', desc: 'Secure Doc Control' },
                            { id: 'SM', name: 'Stock Manager', desc: 'Inventory Intelligence' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{item.id}</div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </div>
                          ))}
                      </div>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                    One ID • All Connect Apps
                </div>
            </div>

            {/* Signup Form Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-sm animate-fade-in-up">
                    <div className="lg:hidden text-center mb-10">
                         <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black mx-auto mb-4">CP</div>
                         <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Connect Publisher</h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Create Account</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 2</p>
                    </div>

                    <div className="bg-white p-1 rounded-[2.5rem] relative">
                        {error && (
                            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleStep1} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Full Name</label>
                                    <input
                                        type="text" required autoFocus
                                        value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Jane Smith"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Work Email</label>
                                    <input
                                        type="email" required
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="jane@company.com"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Password</label>
                                    <input
                                        type="password" required minLength={6}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                                <button type="submit"
                                    className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95">
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Organization Name</label>
                                    <input
                                        type="text" required autoFocus
                                        value={orgName} onChange={e => handleOrgNameChange(e.target.value)}
                                        placeholder="Book Magic Publishing"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                                    />
                                    {orgSlug && (
                                        <p className="text-[9px] font-black text-indigo-500 mt-2 uppercase tracking-widest leading-none">
                                            Workspace: {orgSlug}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="px-6 py-5 border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50">
                                        {loading ? 'Creating...' : 'Launch Platform'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-10 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Already registered? <Link href="/login" className="text-indigo-600 hover:underline">Log in</Link>
                            </p>
                        </div>
                    </div>
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
