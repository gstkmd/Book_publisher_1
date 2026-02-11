import { OrgSettings } from '@/components/OrgSettings';
import { MemberList } from '@/components/MemberList';
import { Billing } from '@/components/Billing';

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Organization Settings</h1>

            <OrgSettings />
            <MemberList />
            <Billing />
        </div>
    );
}
