"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingDots from '@/components/LoadingDots';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return <LoadingDots height="h-64" />;
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    return <>{children}</>;
}
