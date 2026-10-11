'use client';

import { useSearchParams } from 'next/navigation';
import { PaymentReturn, usePollUntilFinal } from '@sjolystinnovation/app-kit/payments';
import LoadingDots from '@/components/LoadingDots';
import ShopService, { Order } from '@/services/shopService';

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
    const state = status === 'Paid' || status === 'Reserved'
        ? 'success'
        : status === 'Pending'
            ? 'pending'
            : 'failed';

    return (
        <PaymentReturn
            state={state}
            className="pb-32"
            success={{ title: 'Payment received!', body: "Your order is confirmed. We'll ship your sensor soon.", href: '/shop', cta: 'Back to shop' }}
            pending={{ title: 'Payment pending', body: 'Your payment is being confirmed by Vipps.', note: "We'll email you a receipt once it's captured.", href: '/profile/billing', cta: 'View billing' }}
            failed={{ title: 'Payment failed', body: 'The payment was not completed. No charge was made.', href: '/shop', cta: 'Try again' }}
            onRefresh={refresh}
        />
    );
}
