'use client';

import { useSearchParams } from 'next/navigation';
import { PaymentReturn, usePollUntilFinal } from '@sjolystinnovation/app-kit/payments';
import LoadingDots from '@/components/LoadingDots';
import SubscriptionService, { Subscription } from '@/services/subscriptionService';

export default function BillingReturnPage() {
    const searchParams = useSearchParams();
    const subscriptionId = searchParams.get('subscriptionId');
    const parsedId = subscriptionId ? parseInt(subscriptionId, 10) : NaN;

    const { data: subscription, loading, refresh } = usePollUntilFinal<Subscription | null>(
        async () => {
            const subs = await SubscriptionService.getMySubscriptions();
            if (!isNaN(parsedId)) {
                return subs.find(s => s.id === parsedId) ?? null;
            }
            // No id in the return URL: fall back to the newest subscription
            // (list is JWT-scoped, so only the current user's subs are visible).
            return subs.length ? subs.reduce((a, b) => (b.id > a.id ? b : a)) : null;
        },
        (s) => s != null && s.status !== 'Pending',
    );

    if (loading) return <LoadingDots height="h-64" />;

    const status = subscription?.status;
    const state = status === 'Active'
        ? 'success'
        : status === 'Pending'
            ? 'pending'
            : 'failed';

    return (
        <PaymentReturn
            state={state}
            className="pb-32"
            success={{ title: 'Subscription active!', body: 'You now have full access to Garge.', href: '/', cta: 'Go to dashboard' }}
            pending={{ title: 'Pending confirmation', body: 'Your subscription is being confirmed by Vipps.', note: "We'll send a confirmation as soon as Vipps responds.", href: '/profile/billing', cta: 'View billing' }}
            failed={{ title: 'Subscription not found', body: 'Something went wrong or the agreement was not completed.', href: '/profile/billing', cta: 'Try again' }}
            onRefresh={refresh}
        />
    );
}
