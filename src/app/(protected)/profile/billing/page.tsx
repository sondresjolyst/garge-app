'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import TestModeBanner from '@/components/TestModeBanner';
import TestPill from '@/components/TestPill';
import RedirectingOverlay from '@/components/RedirectingOverlay';
import ConfirmModal from '@/components/ConfirmModal';
import QuantityChangeModal from '@/components/QuantityChangeModal';
import { toast } from 'sonner';
import AdminService, { AppSettings } from '@/services/adminService';
import SubscriptionService, { Subscription } from '@/services/subscriptionService';
import ShopService, { Order } from '@/services/shopService';
import { formatNok } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { statusColor } from '@/lib/statusUtils';
import { effectivePriceInOre, vatLabel } from '@/lib/pricing';
import { formatApiError } from '@/lib/errorMessages';

function deriveCancelEndDate(sub: Subscription): string {
    if (sub.nextChargeDate) return formatDate(sub.nextChargeDate);
    if (sub.startDate) {
        const d = new Date(sub.startDate);
        if (sub.interval === 'Monthly') d.setMonth(d.getMonth() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        return formatDate(d.toISOString());
    }
    return 'the end of the current period';
}

export default function BillingPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
    const [qtyTarget, setQtyTarget] = useState<Subscription | null>(null);
    const [updatingQty, setUpdatingQty] = useState(false);
    const [resuming, setResuming] = useState<number | null>(null);
    const [downloading, setDownloading] = useState<number | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [subs, myOrders, settings] = await Promise.all([
                    SubscriptionService.getMySubscriptions(),
                    ShopService.getMyOrders(),
                    AdminService.getAppSettings(),
                ]);
                setSubscriptions(subs);
                setOrders(myOrders);
                setAppSettings(settings);
            } catch (err) {
                toast.error(formatApiError(err, 'Failed to load billing data'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const vatEnabled = appSettings?.vatEnabled ?? false;

    async function handleCancel() {
        if (!cancelTarget) return;
        try {
            await SubscriptionService.cancelSubscription(cancelTarget.id);
            toast.success('Subscription cancelled');
            setCancelTarget(null);
            setSubscriptions(await SubscriptionService.getMySubscriptions());
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to cancel subscription'));
        }
    }

    async function handleQuantityUpdate(newQty: number) {
        if (!qtyTarget) return;
        setUpdatingQty(true);
        try {
            const res = await SubscriptionService.updateSubscriptionQuantity(qtyTarget.id, newQty);
            toast.success(res.message ?? 'Quantity updated. Confirm in Vipps app.');
            setQtyTarget(null);
            setSubscriptions(await SubscriptionService.getMySubscriptions());
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to update quantity'));
        } finally {
            setUpdatingQty(false);
        }
    }

    async function handleResume(sub: Subscription) {
        setResuming(sub.id);
        try {
            const url = await SubscriptionService.getConfirmationUrl(sub.id);
            setRedirecting(true);
            window.location.href = url;
        } catch (err) {
            toast.error(formatApiError(err, 'Could not get Vipps URL'));
            setResuming(null);
        }
    }

    async function handleInvoiceDownload(orderId: number) {
        setDownloading(orderId);
        try {
            await ShopService.downloadInvoice(orderId);
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to download invoice'));
        } finally {
            setDownloading(null);
        }
    }

    if (loading) return <LoadingDots height="h-64" />;

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 pb-32">
            <div className="flex items-center gap-3">
                <Link href="/profile" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </Link>
                <h1 className="text-xl font-display font-bold text-gray-100">Billing</h1>
            </div>

            <TestModeBanner settings={appSettings} />

            <Section title="Subscription">
                {subscriptions.length > 0 ? (
                    <ul className="space-y-2">
                        {subscriptions.map(sub => {
                            const isStoppedGrace = sub.status === 'Stopped' || sub.status === 'Expired';
                            return (
                                <li key={sub.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-100">{sub.productName}</p>
                                                {sub.quantity > 1 && (
                                                    <span className="px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/40 text-gray-300 text-xs font-medium rounded tabular-nums">
                                                        × {sub.quantity}
                                                    </span>
                                                )}
                                                <span className={`px-1.5 py-0.5 border rounded text-xs font-medium ${sub.productType === 'Primary' ? 'bg-sky-900/30 border-sky-700/40 text-sky-400' : 'bg-purple-900/30 border-purple-700/40 text-purple-400'}`}>
                                                    {sub.productType === 'Primary' ? 'Primary' : 'Add-on'}
                                                </span>
                                                <TestPill visible={sub.isTest} />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatNok(effectivePriceInOre(sub.priceInOre, vatEnabled) * sub.quantity)} / {sub.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 border rounded text-xs font-medium ${statusColor(sub.status)}`}>
                                            {sub.status}
                                        </span>
                                    </div>

                                    {isStoppedGrace && sub.nextChargeDate && (
                                        <p className="text-xs text-amber-400">
                                            Cancelled. You keep access until {formatDate(sub.nextChargeDate)}.
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-gray-600">Start date</p>
                                            <p className="text-gray-400 mt-0.5">{sub.startDate ? formatDate(sub.startDate) : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">{isStoppedGrace ? 'Access until' : 'Next charge'}</p>
                                            <p className="text-gray-400 mt-0.5">{sub.nextChargeDate ? formatDate(sub.nextChargeDate) : '—'}</p>
                                        </div>
                                    </div>

                                    {sub.status === 'Pending' && (
                                        <button
                                            onClick={() => handleResume(sub)}
                                            disabled={resuming === sub.id}
                                            className="mt-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
                                            {resuming === sub.id ? 'Opening Vipps…' : 'Complete in Vipps'}
                                        </button>
                                    )}

                                    {sub.status === 'Active' && (
                                        <div className="flex items-center gap-2 mt-1">
                                            {sub.productType === 'AddOn' && (
                                                <button
                                                    onClick={() => setQtyTarget(sub)}
                                                    className="px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 border border-gray-600/40 text-gray-300 text-xs rounded-lg transition-all"
                                                >
                                                    Change quantity
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setCancelTarget(sub)}
                                                className="px-3 py-1.5 bg-gray-700/60 hover:bg-red-900/40 hover:border-red-700/50 border border-gray-600/40 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
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
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/orders/${order.id}`} className="text-xs font-medium text-gray-300 hover:text-sky-400 transition-colors">
                                            Order #{order.id}
                                        </Link>
                                        <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                                        <TestPill visible={order.isTest} />
                                    </div>
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
                                {order.status === 'Paid' && (
                                    <button
                                        onClick={() => handleInvoiceDownload(order.id)}
                                        disabled={downloading === order.id}
                                        className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700/40 hover:bg-gray-700 border border-gray-600/40 text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden />
                                        {downloading === order.id ? 'Downloading…' : 'Download invoice'}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {cancelTarget && (
                <ConfirmModal
                    title="Cancel subscription"
                    message={
                        <>
                            <p>Cancel <span className="font-medium text-gray-100">{cancelTarget.productName}</span>? You keep access until {deriveCancelEndDate(cancelTarget)}.</p>
                            {cancelTarget.productType === 'Primary' && (
                                <p className="mt-2 text-xs text-amber-400">
                                    Cancelling Primary also cancels any active add-on subscriptions.
                                </p>
                            )}
                            <p className="mt-2 text-xs text-amber-400">
                                After {deriveCancelEndDate(cancelTarget)}, sensors above your plan are turned off.
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                                Your history is kept for as long as you own the device, so if you come back — even after a seasonal break — you can pick up where you left off and compare year over year. You can turn this off in <Link href="/profile" className="text-sky-400 hover:text-sky-300">your profile</Link>, and you can export or remove any sensor anytime.
                            </p>
                        </>
                    }
                    confirmLabel="Cancel subscription"
                    onConfirm={handleCancel}
                    onCancel={() => setCancelTarget(null)}
                />
            )}

            {qtyTarget && (
                <QuantityChangeModal
                    subscription={qtyTarget}
                    vatEnabled={vatEnabled}
                    submitting={updatingQty}
                    onConfirm={handleQuantityUpdate}
                    onCancel={() => setQtyTarget(null)}
                />
            )}

            {redirecting && <RedirectingOverlay />}
        </div>
    );
}
