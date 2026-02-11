'use client';
import React from 'react';

export default function RightsPortal() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Rights Management Portal</h1>

            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-xl font-bold mb-4">Active Licenses</h2>
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
                        <tr className="border-b">
                            <td className="p-3">Introduction to Biology</td>
                            <td className="p-3">North America</td>
                            <td className="p-3">Exclusive</td>
                            <td className="p-3">2028-12-31</td>
                            <td className="p-3 text-green-600 font-bold">Active</td>
                        </tr>
                        <tr className="border-b">
                            <td className="p-3">World History Vol 1</td>
                            <td className="p-3">Global</td>
                            <td className="p-3">Non-Exclusive</td>
                            <td className="p-3">2025-06-30</td>
                            <td className="p-3 text-yellow-600 font-bold">Expiring Soon</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Royalty Calculator</h2>
                    <div className="text-gray-500 italic">Select a contract to calculate owed royalties based on sales data.</div>
                    <button className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-not-allowed">Calculate (Coming Soon)</button>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Contract Templates</h2>
                    <div className="space-y-2">
                        <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">Standard Author Agreement (v2)</div>
                        <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">Illustrator Work-for-Hire</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
