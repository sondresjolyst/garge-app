'use client';

import LoadingDots from '@/components/LoadingDots';
import ReturnStatusPage from '@/components/ReturnStatusPage';
import SubscriptionService, { Subscription } from '@/services/subscriptionService';
import { usePollUntilFinal } from '@/lib/usePollUntilFinal';

export default function BillingReturnPage() {
    const { data: subscription, loading, refresh } = usePollUntilFinal<Subscription | null>(
        async () => {
            const subs = await SubscriptionService.getMySubscriptions();
            return subs.at(-1) ?? null;
        },
        (s) => s != null && s.status !== 'Pending',
    );

    if (loading) return <LoadingDots height="h-64" />;

    const status = subscription?.status;
    const variant = status === 'Active'
        ? 'success'
        : status === 'Pending'
            ? 'pending'
            : 'failed';

    return (
        <ReturnStatusPage
            variant={variant}
            successTitle="Subscription active!"
            successBody="You now have full access to Garge."
            successHref="/"
            successCta="Go to dashboard"
            pendingTitle="Pending confirmation"
            pendingBody="Your subscription is being confirmed by Vipps."
            pendingEmailNote="We'll send a confirmation as soon as Vipps responds."
            pendingHref="/profile/billing"
            pendingCta="View billing"
            onRefresh={refresh}
            failedTitle="Subscription not found"
            failedBody="Something went wrong or the agreement was not completed."
            failedHref="/profile/billing"
            failedCta="Try again"
        />
    );
}
