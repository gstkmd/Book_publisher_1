'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const isMainDashboard = pathname === '/dashboard';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Global Header */}
            <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-violet-500 transition-all">
                                Trojan Horse
                            </span>
                        </Link>


                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-gray-100">
                                <div className="text-right">
                                    <div className="text-xs font-black text-gray-900 line-clamp-1">{user.full_name || user.email}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.role}</div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                    {(user.full_name || user.email)[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Back Button (Floating) */}


            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
