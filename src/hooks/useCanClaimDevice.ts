'use client';

import { useCallback, useEffect, useState } from 'react';
import SensorService from '@/services/sensorService';
import SubscriptionService from '@/services/subscriptionService';

export interface CanClaimDeviceResult {
    canClaim: boolean;
    loading: boolean;
    ownedSensorCount: number;
    activeSubscriptionCount: number;
    refresh: () => Promise<void>;
}

/**
 * Mirrors the backend ActiveSubscriptionRequirement check so the UI can hide or
 * disable the claim button before submit. The first sensor is always claimable
 * because the requirement short-circuits when the user owns zero sensors; after
 * that the user needs at least as many active subscriptions as owned sensors.
 *
 * Subscription quantity is intentionally not summed — the backend currently
 * counts subscription rows, not quantities. If that changes, update both sides.
 */
export function useCanClaimDevice(): CanClaimDeviceResult {
    const [ownedSensorCount, setOwnedSensorCount] = useState(0);
    const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [sensors, subscriptions] = await Promise.all([
                SensorService.getAllSensors().catch(() => []),
                SubscriptionService.getMySubscriptions().catch(() => []),
            ]);
            setOwnedSensorCount(sensors.length);
            setActiveSubscriptionCount(subscriptions.filter(s => s.status === 'Active').length);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const canClaim = ownedSensorCount === 0 || activeSubscriptionCount >= ownedSensorCount;

    return { canClaim, loading, ownedSensorCount, activeSubscriptionCount, refresh };
}
