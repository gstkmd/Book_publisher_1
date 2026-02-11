'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user'); // Default to basic user
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/users/', {
                email,
                password,
                full_name: fullName,
                role
            });
            router.push('/login?registered=true');
        } catch (err: any) {
            // Safe error handling to extract message
            let msg = 'Registration failed';
            try {
                const json = JSON.parse(err.message);
                msg = json.detail || msg;
            } catch { }
            setError(msg);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="user">Reader/Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="author">Author</option>
                            <option value="illustrator">Illustrator</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="section_editor">Section Editor</option>
                            <option value="editor_in_chief">Editor-in-Chief</option>
                            <option value="admin">Administrator</option>
                        </select>
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
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
