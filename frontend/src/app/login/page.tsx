'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const res = await api.post('/auth/access-token', formData, undefined, true);
            login(res.access_token);
        } catch (err: any) {
            let errorMessage = 'Invalid email or password';
            setError(errorMessage);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Left Panel: Promotion */}
            <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-between p-16 border-r border-slate-200 relative z-10">
                <div>
                  <Link href="/" className="flex items-center gap-3 mb-24 cursor-pointer">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">CP</div>
                      <span className="text-2xl font-black uppercase tracking-tighter text-slate-900">Connect Publisher</span>
                  </Link>
                  <div className="max-w-md">
                      <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter mb-6">
                        One Account. <br/>A Whole Suite of Tools.
                      </h2>
                      <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">
                        Your Connect ID gives you seamless access to our entire enterprise ecosystem.
                      </p>
                      
                      <div className="space-y-6">
                          {[
                            { id: 'CS', name: 'Compliance Sarthi', desc: 'Secure Document Orchestration' },
                            { id: 'SM', name: 'Stock Manager', desc: 'Inventory & Logistical Control' },
                            { id: 'AC', name: 'AccountCloud', desc: 'Enterprise Cloud Accounting' }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:translate-x-2 transition-transform cursor-pointer group">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 transition-colors">{item.id}</div>
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
                    Enterprise Grade Security • 256-bit Encryption
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 relative">
                {/* Background soft pulse */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse"></div>

                <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
                    <div className="lg:hidden text-center mb-12">
                         <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black mx-auto mb-4">CP</div>
                         <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Connect Publisher</h1>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Welcome Back</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provide your credentials to enter</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block px-1">Email Address</label>
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
                                    type="password" required
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none transition-all text-sm font-bold"
                                />
                                <div className="flex justify-end mt-2">
                                    <Link href="/login/forgot-password" title="Recover your password" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-slate-900 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                New here? <Link href="/signup" className="text-indigo-600 hover:underline">Create Account</Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-indigo-600 transition-colors">
                            ← Back to home
                        </Link>
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
