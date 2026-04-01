'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ModuleGuard from '@/components/ModuleGuard';

export default function RightsPortal() {
    const { token } = useAuth();
    const [licenses, setLicenses] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<string | null>(null);
    const [royaltyResult, setRoyaltyResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        try {
            const [licData, conData] = await Promise.all([
                api.get('/rights/licenses', token!),
                api.get('/rights/contracts', token!)
            ]);
            setLicenses(licData);
            setContracts(conData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateRoyalties = async (contractId: string) => {
        try {
            const result = await api.get(`/rights/royalties/${contractId}`, token!);
            setRoyaltyResult(result);
        } catch (err) {
            alert('Failed to calculate royalties');
        }
    };

    if (loading) return <div className="p-8 font-black uppercase tracking-widest text-slate-400 animate-pulse text-xs text-center border-2 border-dashed border-slate-100 rounded-[3rem] my-20">Loading rights & integrity data...</div>;

    return (
        <ModuleGuard moduleName="rights">
            <div className="container mx-auto py-8 text-slate-900">
                <div className="mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Rights & Integrity</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Global licensing, royalties, and contract administration.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-10 -mt-10" />
                    <h2 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                        Active Licenses
                    </h2>
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Territory</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {licenses.map((license, idx) => (
                                    <tr key={license._id || idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-sm text-slate-900">{license.title}</td>
                                        <td className="p-4 text-xs font-medium text-slate-500">{license.territory}</td>
                                        <td className="p-4 text-xs font-medium text-slate-500">{license.type}</td>
                                        <td className="p-4 text-xs font-bold text-slate-700">{new Date(license.end_date).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${license.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : license.status === 'expiring_soon'
                                                        ? 'bg-amber-50 text-amber-600 animate-pulse'
                                                        : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {license.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {licenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No active licenses found in this jurisdiction.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-[4rem] -mr-8 -mt-8" />
                        <h2 className="text-lg font-black mb-6 uppercase tracking-tight">Royalty Calculator</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Active Contract</label>
                                <select
                                    className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                    onChange={(e) => setSelectedContract(e.target.value)}
                                >
                                    <option value="">Choose a contract pool...</option>
                                    {contracts.map(c => (
                                        <option key={c._id} value={c._id}>
                                            POOL_{c._id.slice(-6).toUpperCase()} • AUTHOR_{c.user_id?.split('/').pop()?.slice(-6).toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => selectedContract && calculateRoyalties(selectedContract)}
                                disabled={!selectedContract}
                                className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
                            >
                                Generate Royalty Report
                            </button>

                            {royaltyResult && (
                                <div className="mt-6 p-6 bg-emerald-50 rounded-3xl border border-dashed border-emerald-200 animate-in zoom-in-95 duration-300">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Sales Volume</span>
                                        <span className="font-black text-emerald-900">{royaltyResult.units_sold} Units</span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-emerald-100 mt-2 pt-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Current Liability</span>
                                        <div className="text-2xl font-black text-emerald-900 tracking-tighter">
                                            {royaltyResult.currency} {royaltyResult.total_royalties.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h2 className="text-lg font-black mb-6 uppercase tracking-tight">System Contracts</h2>
                        <div className="space-y-3">
                            {contracts.map(c => (
                                <div key={c._id} className="p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all flex justify-between items-center group cursor-pointer">
                                    <div>
                                        <div className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">Standard IP Agreement</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            Fixed Rate: <span className="text-indigo-600">{(c.royalty_rate * 100).toFixed(1)}%</span> • {c.payment_terms}
                                        </div>
                                    </div>
                                    <span className="text-[8px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">Verified</span>
                                </div>
                            ))}
                            {contracts.length === 0 && (
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                    No legal frameworks registered.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ModuleGuard>
    );
}
