'use client';

import { useCallback, useEffect, useState } from 'react';
import SensorService, { SensorCapacity } from '@/services/sensorService';

export interface CanClaimDeviceResult {
    canClaim: boolean;
    loading: boolean;
    used: number;
    capacity: number;
    /** True when a role grants service access without a subscription (e.g. ComplimentaryUser). */
    bypass: boolean;
    refresh: () => Promise<void>;
}

/**
 * Reads the caller's sensor capacity + claim eligibility from the backend
 * (GET /sensors/capacity) — the single source of truth. The client does not
 * re-derive capacity or duplicate the subscription-bypass role list.
 */
export function useCanClaimDevice(): CanClaimDeviceResult {
    const [data, setData] = useState<SensorCapacity>({ capacity: 0, used: 0, bypass: false, canClaim: false });
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            setData(await SensorService.getSensorCapacity());
        } catch {
            setData({ capacity: 0, used: 0, bypass: false, canClaim: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        canClaim: data.canClaim,
        loading,
        used: data.used,
        capacity: data.capacity,
        bypass: data.bypass,
        refresh,
    };
}
