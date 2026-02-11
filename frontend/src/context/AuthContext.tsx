'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

interface User {
    email: string;
    full_name?: string;
    role: 'admin' | 'editor_in_chief' | 'section_editor' | 'author' | 'reviewer' | 'illustrator' | 'teacher' | 'user';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // Fetch user details
            api.get('/users/me', storedToken)
                .then((userData) => setUser(userData))
                .catch(() => {
                    logout();
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        api.get('/users/me', newToken).then((userData) => setUser(userData));
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
