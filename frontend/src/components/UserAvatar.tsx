import React from 'react';

interface UserAvatarProps {
    name?: string;
    className?: string; // Additional classes
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

const COLORS = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-700',
    'bg-lime-100 text-lime-700',
    'bg-green-100 text-green-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-purple-100 text-purple-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700',
    'bg-rose-100 text-rose-700',
];

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, className = '', size = 'md' }) => {
    const getInitials = (n?: string) => {
        if (!n) return '?';
        const parts = n.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getColor = (n?: string) => {
        if (!n) return 'bg-gray-100 text-gray-600';
        let hash = 0;
        for (let i = 0; i < n.length; i++) {
            hash = n.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % COLORS.length;
        return COLORS[index];
    };

    const sizeClasses = {
        xs: 'w-5 h-5 text-[9px]',
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold uppercase transition-colors select-none ${getColor(name)} ${className}`}
            title={name}
        >
            {getInitials(name)}
        </div>
    );
};
