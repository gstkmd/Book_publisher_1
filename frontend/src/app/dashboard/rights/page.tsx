'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

    if (loading) return <div className="p-8">Loading rights data...</div>;

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Rights Management Portal</h1>

            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-xl font-bold mb-4">Active Licenses</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3">Title</th>
                                <th className="p-3">Territory</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Expiration</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {licenses.map((license, idx) => (
                                <tr key={license._id || idx} className="border-b">
                                    <td className="p-3 font-medium">{license.title}</td>
                                    <td className="p-3">{license.territory}</td>
                                    <td className="p-3">{license.type}</td>
                                    <td className="p-3">{new Date(license.end_date).toLocaleDateString()}</td>
                                    <td className={`p-3 font-bold ${license.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                                        {license.status}
                                    </td>
                                </tr>
                            ))}
                            {licenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">No licenses found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Royalty Calculator</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Contract</label>
                            <select
                                className="w-full p-2 border rounded"
                                onChange={(e) => setSelectedContract(e.target.value)}
                            >
                                <option value="">Choose a contract...</option>
                                {contracts.map(c => (
                                    <option key={c._id} value={c._id}>
                                        Contract {c._id.slice(-6)} (Author ID: {c.user_id?.split('/').pop()?.slice(-6)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => selectedContract && calculateRoyalties(selectedContract)}
                            disabled={!selectedContract}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                        >
                            Calculate Royalties
                        </button>

                        {royaltyResult && (
                            <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
                                <div className="text-sm text-green-700">Units Sold: <b>{royaltyResult.units_sold}</b></div>
                                <div className="text-lg font-bold text-green-800">Total Owed: {royaltyResult.currency} {royaltyResult.total_royalties.toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Contract Management</h2>
                    <div className="space-y-2">
                        {contracts.map(c => (
                            <div key={c._id} className="p-3 border rounded hover:bg-gray-50 transition flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-bold">Standard Agreement</div>
                                    <div className="text-xs text-gray-500">Rate: {(c.royalty_rate * 100).toFixed(1)}% | {c.payment_terms}</div>
                                </div>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase font-bold">Active</span>
                            </div>
                        ))}
                        {contracts.length === 0 && (
                            <div className="text-gray-400 italic text-center py-4">No contracts registered.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
