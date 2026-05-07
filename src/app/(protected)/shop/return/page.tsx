'use client';

import { useSearchParams } from 'next/navigation';
import LoadingDots from '@/components/LoadingDots';
import ReturnStatusPage from '@/components/ReturnStatusPage';
import ShopService, { Order } from '@/services/shopService';
import { usePollUntilFinal } from '@/lib/usePollUntilFinal';

export default function ShopReturnPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const parsedId = orderId ? parseInt(orderId, 10) : NaN;

    const { data: order, loading, refresh } = usePollUntilFinal<Order | null>(
        async () => {
            const orders = await ShopService.getMyOrders();
            return !isNaN(parsedId)
                ? (orders.find(o => o.id === parsedId) ?? null)
                : (orders[0] ?? null);
        },
        (o) => o != null && o.status !== 'Pending',
    );

    if (loading) return <LoadingDots height="h-64" />;

    const status = order?.status;
    const variant = status === 'Paid' || status === 'Reserved'
        ? 'success'
        : status === 'Pending'
            ? 'pending'
            : 'failed';

    return (
        <ReturnStatusPage
            variant={variant}
            successTitle="Payment received!"
            successBody="Your order is confirmed. We'll ship your sensor soon."
            successHref="/shop"
            successCta="Back to shop"
            pendingTitle="Payment pending"
            pendingBody="Your payment is being confirmed by Vipps."
            pendingEmailNote="We'll email you a receipt once it's captured."
            pendingHref="/profile/billing"
            pendingCta="View billing"
            onRefresh={refresh}
            failedTitle="Payment failed"
            failedBody="The payment was not completed. No charge was made."
            failedHref="/shop"
            failedCta="Try again"
        />
    );
}
