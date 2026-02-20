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
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <Link href="/" className="mb-6 flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </Link>
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Login to Platform</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign in
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
