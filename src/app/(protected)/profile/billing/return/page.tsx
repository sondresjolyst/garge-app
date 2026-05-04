'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingDots from '@/components/LoadingDots';
import SubscriptionService, { Subscription } from '@/services/subscriptionService';

export default function BillingReturnPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const retried = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        async function check() {
            try {
                const sub = await SubscriptionService.getMySubscription();
                setSubscription(sub);
                if (sub?.status === 'Pending' && !retried.current) {
                    retried.current = true;
                    timeoutRef.current = setTimeout(async () => {
                        const sub2 = await SubscriptionService.getMySubscription();
                        setSubscription(sub2);
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
    }, []);

    if (loading) return <LoadingDots height="h-64" />;

    const status = subscription?.status;

    return (
        <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center gap-5 text-center pb-32">
            {status === 'Active' ? (
                <>
                    <CheckCircleIcon className="h-16 w-16 text-green-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Subscription active!</p>
                    <p className="text-sm text-gray-500">You now have full access to Garge.</p>
                    <Link href="/" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Go to dashboard
                    </Link>
                </>
            ) : status === 'Pending' ? (
                <>
                    <ClockIcon className="h-16 w-16 text-amber-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Pending confirmation</p>
                    <p className="text-sm text-gray-500">Your subscription is being confirmed by Vipps. This usually takes a moment.</p>
                    <Link href="/profile/billing" className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                        Back to billing
                    </Link>
                </>
            ) : (
                <>
                    <XCircleIcon className="h-16 w-16 text-red-400" />
                    <p className="text-xl font-display font-bold text-gray-100">Subscription not found</p>
                    <p className="text-sm text-gray-500">Something went wrong or the agreement was not completed.</p>
                    <Link href="/profile/billing" className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                        Try again
                    </Link>
                </>
            )}
        </div>
    );
}
