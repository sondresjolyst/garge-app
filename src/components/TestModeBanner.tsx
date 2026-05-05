import { AppSettings } from '@/services/adminService';

export default function TestModeBanner({ settings }: { settings: AppSettings | null }) {
    if (!settings?.vippsTestMode) return null;
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-amber-400">Vipps test mode is active — no real payments will be processed</p>
        </div>
    );
}
