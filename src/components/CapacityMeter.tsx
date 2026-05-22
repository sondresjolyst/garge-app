import Link from 'next/link';

interface CapacityMeterProps {
    /** Active (non-suspended) owned sensors consuming capacity. */
    used: number;
    /** Sensors covered by the active subscription (1 Primary + add-on quantities); 0 without one. */
    capacity: number;
    /** Role-based access without a subscription (e.g. ComplimentaryUser) — no capacity limit. */
    bypass?: boolean;
    loading?: boolean;
}

/**
 * Shows how much sensor capacity is in use ("3 of 6 used") with a segmented bar.
 * Capacity is additive (Primary covers 1 + each add-on adds quantity). Users with a
 * subscription-bypass role have complimentary, unlimited access.
 */
export default function CapacityMeter({ used, capacity, bypass = false, loading = false }: CapacityMeterProps) {
    if (loading) {
        return <div className="h-12 rounded-xl bg-gray-800/40 animate-pulse" />;
    }

    if (bypass) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-900/50 border border-gray-700/40 px-3 py-2.5">
                <span className="text-xs text-gray-400">Sensor capacity</span>
                <span className="text-xs font-medium text-emerald-400">Complimentary access · {used} active</span>
            </div>
        );
    }

    if (capacity === 0) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-900/50 border border-gray-700/40 px-3 py-2.5">
                <p className="text-xs text-gray-400">No active subscription — no sensor capacity.</p>
                <Link href="/shop" className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap">See plans →</Link>
            </div>
        );
    }

    const atCapacity = used >= capacity;
    const fillClass = atCapacity ? 'bg-amber-500' : 'bg-sky-500';

    return (
        <div className="rounded-xl bg-gray-900/50 border border-gray-700/40 px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">Sensor capacity</span>
                <span className={`text-xs font-medium tabular-nums ${atCapacity ? 'text-amber-400' : 'text-gray-200'}`}>
                    {used} of {capacity} used
                </span>
            </div>
            {capacity <= 12 && (
                <div className="flex items-center gap-1" aria-hidden>
                    {Array.from({ length: capacity }).map((_, i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < used ? fillClass : 'bg-gray-700/50'}`} />
                    ))}
                </div>
            )}
            {atCapacity && (
                <p className="text-[11px] text-amber-400/80">At capacity — turn a sensor off, or add capacity to add more.</p>
            )}
        </div>
    );
}
