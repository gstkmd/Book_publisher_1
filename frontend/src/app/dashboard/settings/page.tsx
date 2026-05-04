import { OrgSettings } from '@/components/OrgSettings';
import { MemberList } from '@/components/MemberList';
import { Billing } from '@/components/Billing';

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Organization Command Center
                </h1>
                <p className="text-slate-500 font-medium mt-2">Manage your team, configure modules, and handle subscriptions.</p>
            </div>

            <div className="space-y-12">
                <section>
                    <OrgSettings />
                </section>
                
                <section>
                    <MemberList />
                </section>
                
                <section>
                    <Billing />
                </section>
            </div>
        </div>
    );
}
