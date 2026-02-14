import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: string;
    description?: string;
    color?: string;
}

export function MetricCard({ title, value, icon, description, color = 'blue' }: MetricCardProps) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-100 border-blue-200',
        green: 'text-green-600 bg-green-100 border-green-200',
        purple: 'text-purple-600 bg-purple-100 border-purple-200',
        orange: 'text-orange-600 bg-orange-100 border-orange-200',
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg border ${activeColor}`}>
                    <span className="text-2xl">{icon}</span>
                </div>
                {description && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {description}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
}
