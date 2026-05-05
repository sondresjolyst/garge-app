'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import TestModeBanner from '@/components/TestModeBanner';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import AdminService, { AppSettings } from '@/services/adminService';
import SubscriptionService, { Subscription } from '@/services/subscriptionService';
import ShopService, { Order } from '@/services/shopService';
import { formatNok } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { statusColor } from '@/lib/statusUtils';

function effectivePrice(priceInOre: number, vatEnabled: boolean): number {
    return vatEnabled ? Math.round(priceInOre * 1.25) : priceInOre;
}

function vatLabel(vatEnabled: boolean): string {
    return vatEnabled ? 'inkl. mva' : 'ekskl. mva';
}

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [sub, myOrders, settings] = await Promise.all([
                    SubscriptionService.getMySubscription(),
                    ShopService.getMyOrders(),
                    AdminService.getAppSettings(),
                ]);
                setSubscription(sub);
                setOrders(myOrders);
                setAppSettings(settings);
            } catch {
                toast.error('Failed to load billing data');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const vatEnabled = appSettings?.vatEnabled ?? false;
    const hasActive = subscription?.status === 'Active' || subscription?.status === 'Pending';

    async function handleCancel() {
        await SubscriptionService.cancelSubscription();
        toast.success('Subscription cancelled');
        setCancelConfirm(false);
        const sub = await SubscriptionService.getMySubscription();
        setSubscription(sub);
    }

    if (loading) return <LoadingDots height="h-64" />;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
            <div className="flex items-center gap-3">
                <Link href="/profile" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                    <ArrowLeftIcon className="h-4 w-4" />
                </Link>
                <h1 className="text-xl font-display font-bold text-gray-100">Billing</h1>
            </div>

            <TestModeBanner settings={appSettings} />

            <Section title="Subscription">
                {hasActive && subscription ? (
                    <div className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-100">{subscription.productName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formatNok(effectivePrice(subscription.priceInOre, vatEnabled))} / {subscription.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                                </p>
                            </div>
                            <span className={`px-2 py-0.5 border rounded text-xs font-medium ${statusColor(subscription.status)}`}>
                                {subscription.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-gray-600">Start date</p>
                                <p className="text-gray-400 mt-0.5">{subscription.startDate ? formatDate(subscription.startDate) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Next charge</p>
                                <p className="text-gray-400 mt-0.5">{subscription.nextChargeDate ? formatDate(subscription.nextChargeDate) : '—'}</p>
                            </div>
                        </div>
                        {subscription.status === 'Active' && (
                            <button
                                onClick={() => setCancelConfirm(true)}
                                className="mt-1 px-3 py-1.5 bg-gray-700/60 hover:bg-red-900/40 hover:border-red-700/50 border border-gray-600/40 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
                            >
                                Cancel subscription
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-3 py-1">
                        <p className="text-sm text-gray-500">No active subscription.</p>
                        <Link
                            href="/shop"
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Browse plans
                        </Link>
                    </div>
                )}
            </Section>

            {orders.length > 0 && (
                <Section title="Order history">
                    <ul className="space-y-2">
                        {orders.map(order => (
                            <li key={order.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-300">{formatNok(order.totalInOre)}</span>
                                        <span className={`px-2 py-0.5 border rounded text-xs font-medium ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                <ul className="space-y-0.5">
                                    {order.items.map(oi => (
                                        <li key={oi.id} className="text-xs text-gray-400 flex justify-between">
                                            <span>{oi.shopItemName} × {oi.quantity}</span>
                                            <span>{formatNok(oi.priceAtPurchaseInOre * oi.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {cancelConfirm && (
                <ConfirmModal
                    title="Cancel subscription"
                    message={`Cancel your subscription? You keep access until ${subscription?.nextChargeDate ? formatDate(subscription.nextChargeDate) : 'the end of the current period'}.`}
                    confirmLabel="Cancel subscription"
                    onConfirm={handleCancel}
                    onCancel={() => setCancelConfirm(false)}
                />
            )}
        </div>
    );
}
