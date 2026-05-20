'use client';

import { useCallback, useEffect, useState } from 'react';
import SensorService from '@/services/sensorService';
import SubscriptionService from '@/services/subscriptionService';

export interface CanClaimDeviceResult {
    canClaim: boolean;
    loading: boolean;
    ownedSensorCount: number;
    capacity: number;
    primaryActive: boolean;
    refresh: () => Promise<void>;
}

/**
 * Mirrors the backend ActiveSubscriptionRequirement so the UI can hide the claim button
 * before submit. Capacity model:
 *
 *   - An active Primary subscription grants a base allowance of 1 owned sensor.
 *   - Each active AddOn subscription contributes its quantity to the allowance.
 *   - Without an active Primary the allowance is 0 — AddOns alone are not enough.
 *
 * A claim is allowed when ownedSensorCount < capacity. Shared sensors are tracked with
 * IsOwner=false on the backend and are not counted here either (the sensors endpoint
 * does not currently expose ownership and sharing is not implemented yet).
 */
export function useCanClaimDevice(): CanClaimDeviceResult {
    const [ownedSensorCount, setOwnedSensorCount] = useState(0);
    const [primaryActive, setPrimaryActive] = useState(false);
    const [addOnCapacity, setAddOnCapacity] = useState(0);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [sensors, subscriptions] = await Promise.all([
                SensorService.getAllSensors().catch(() => []),
                SubscriptionService.getMySubscriptions().catch(() => []),
            ]);
            const activeSubs = subscriptions.filter(s => s.status === 'Active');
            setOwnedSensorCount(sensors.length);
            setPrimaryActive(activeSubs.some(s => s.productType === 'Primary'));
            setAddOnCapacity(
                activeSubs
                    .filter(s => s.productType === 'AddOn')
                    .reduce((sum, s) => sum + (s.quantity ?? 0), 0),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const capacity = primaryActive ? 1 + addOnCapacity : 0;
    const canClaim = ownedSensorCount < capacity;

    return { canClaim, loading, ownedSensorCount, capacity, primaryActive, refresh };
}
