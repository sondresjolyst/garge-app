'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';

let cache: { userId: string; features: Promise<string[]> } | null = null;

function loadFeatures(userId: string): Promise<string[]> {
    if (cache?.userId === userId) return cache.features;
    const features: Promise<string[]> = UserService.getUserProfile()
        .then(profile => profile.features ?? [])
        .catch(() => {
            if (cache?.features === features) cache = null;
            return [];
        });
    cache = { userId, features };
    return features;
}

/**
 * Whether the signed-in user has a feature, from `features` on their profile.
 * The profile is fetched once per signed-in user and shared by every caller.
 */
export function useFeature(feature: string): boolean {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [loaded, setLoaded] = useState<{ userId: string; features: string[] } | null>(null);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        loadFeatures(userId).then(features => {
            if (active) setLoaded({ userId, features });
        });
        return () => { active = false; };
    }, [userId]);

    return !!loaded && loaded.userId === userId && loaded.features.includes(feature);
}
