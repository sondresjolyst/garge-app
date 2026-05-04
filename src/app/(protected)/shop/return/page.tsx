'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingDots from '@/components/LoadingDots';
import ShopService, { Order } from '@/services/shopService';

export default function ShopReturnPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const retried = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        const parsedId = orderId ? parseInt(orderId, 10) : NaN;

        async function findOrder(orders: Order[]) {
            return !isNaN(parsedId) ? (orders.find(o => o.id === parsedId) ?? null) : (orders[0] ?? null);
        }

        async function check() {
            try {
                const target = await findOrder(await ShopService.getMyOrders());
                setOrder(target);
                if (target?.status === 'Pending' && !retried.current) {
                    retried.current = true;
                    timeoutRef.current = setTimeout(async () => {
                        const target2 = await findOrder(await ShopService.getMyOrders());
                        setOrder(target2);
                        setLoading(false);
                    }, 3000);
                } else {
                    setLoading(false);
                }
            } catch {
                setLoading(false);
            }
        }
        check();
        return () => clearTimeout(timeoutRef.current);
    }, [orderId]);

    if (loading) return <LoadingDots height="h-64" />;

    const status = order?.status;

    return (
        <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center gap-5 text-center pb-32">
            {status === 'Paid' ? (
                <>
                    <CheckCircleIcon className="h-16 w-16 text-green-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Payment received!</p>
                    <p className="text-sm text-gray-500">Your order is confirmed. We&apos;ll ship your sensor soon.</p>
                    <Link href="/shop" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Back to shop
                    </Link>
                </>
            ) : status === 'Pending' ? (
                <>
                    <ClockIcon className="h-16 w-16 text-amber-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Payment pending</p>
                    <p className="text-sm text-gray-500">Your payment is being confirmed by Vipps. This usually takes a moment.</p>
                    <Link href="/shop" className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                        Back to shop
                    </Link>
                </>
            ) : (
                <>
                    <XCircleIcon className="h-16 w-16 text-red-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Payment failed</p>
                    <p className="text-sm text-gray-500">The payment was not completed. No charge was made.</p>
                    <Link href="/shop" className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                        Try again
                    </Link>
                </>
            )}
        </div>
    );
}
