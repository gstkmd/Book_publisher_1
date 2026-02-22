import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
