'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const Billing = () => {
    const { token } = useAuth();
    const [org, setOrg] = useState<any>(null);

    useEffect(() => {
        if (token) fetchOrg();
    }, [token]);

    const fetchOrg = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrg(data);
        } catch (err) { console.error(err); }
    };

    if (!org) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Subscription & Billing</h2>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-sm text-gray-500">Current Plan</div>
                    <div className="text-lg font-semibold uppercase text-green-600">{org.plan}</div>
                </div>
                {org.plan === 'free' && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Upgrade to Pro
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-500">
                Payment handling via Stripe (Coming Soon).
            </p>
        </div>
    );
};
