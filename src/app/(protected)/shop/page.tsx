'use client';

import { useEffect, useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import TestModeBanner from '@/components/TestModeBanner';
import PaymentPhoneModal from '@/components/PaymentPhoneModal';
import RedirectingOverlay from '@/components/RedirectingOverlay';
import { toast } from 'sonner';
import AdminService, { AppSettings } from '@/services/adminService';
import ProductService, { Product } from '@/services/productService';
import ShopService, { ShopItem } from '@/services/shopService';
import SubscriptionService from '@/services/subscriptionService';
import { formatNok } from '@/lib/formatUtils';
import { effectivePriceInOre, vatLabel } from '@/lib/pricing';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { formatApiError } from '@/lib/errorMessages';

export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [hasActivePrimary, setHasActivePrimary] = useState(false);
    const [loading, setLoading] = useState(true);

    const [phoneItemModal, setPhoneItemModal] = useState<{ item: ShopItem; quantity: number } | null>(null);
    const [phoneSubModal, setPhoneSubModal] = useState<Product | null>(null);
    const [savedPhone, setSavedPhone] = useLocalStorage('garge-phone', '');
    const [purchasing, setPurchasing] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [quantities, setQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        Promise.all([
            ShopService.getShopItems(),
            ProductService.getProducts(),
            AdminService.getAppSettings(),
            // A 401/empty mySubs shouldn't break the shop, so swallow + treat as no primary.
            SubscriptionService.getMySubscriptions().catch(() => []),
        ])
            .then(([shopItems, prods, settings, mySubs]) => {
                setItems(shopItems);
                setProducts(prods);
                setAppSettings(settings);
                setHasActivePrimary(mySubs.some(s => s.status === 'Active' && s.productType === 'Primary'));
            })
            .catch(err => toast.error(formatApiError(err, 'Failed to load shop')))
            .finally(() => setLoading(false));
    }, []);

    const vatEnabled = appSettings?.vatEnabled ?? false;

    function getQty(itemId: number): number {
        return quantities[itemId] ?? 1;
    }

    function setQty(itemId: number, q: number, max: number) {
        const clamped = Math.max(1, Math.min(q, max === -1 ? 99 : max));
        setQuantities(prev => ({ ...prev, [itemId]: clamped }));
    }

    function openItemModal(item: ShopItem) {
        setPhoneItemModal({ item, quantity: getQty(item.id) });
    }

    function openSubModal(product: Product) {
        if (product.type === 'AddOn' && !hasActivePrimary) {
            toast.error('Subscribe to the primary plan first.');
            return;
        }
        setPhoneSubModal(product);
    }

    async function handleCheckout(item: ShopItem, quantity: number, msisdn: string) {
        setPurchasing(true);
        try {
            const res = await ShopService.checkout({
                items: [{ shopItemId: item.id, quantity }],
                phoneNumber: msisdn,
            });
            setSavedPhone(msisdn);
            setRedirecting(true);
            window.location.href = res.redirectUrl;
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to initiate payment'));
            setPurchasing(false);
        }
    }

    async function handleInitiate(product: Product, msisdn: string) {
        setPurchasing(true);
        try {
            const res = await SubscriptionService.initiateSubscription({
                productId: product.id,
                phoneNumber: msisdn,
                consentToWaiveWithdrawal: true,
            });
            setSavedPhone(msisdn);
            setRedirecting(true);
            window.location.href = res.vippsConfirmationUrl;
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to initiate subscription'));
            setPurchasing(false);
        }
    }

    if (loading) return <LoadingDots height="h-64" />;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
            <h1 className="text-xl font-display font-bold text-gray-100">Shop</h1>

            <TestModeBanner settings={appSettings} />

            {items.length > 0 && (
                <Section title="Products">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(item => {
                            const outOfStock = item.stockCount === 0;
                            const qty = getQty(item.id);
                            const max = item.stockCount === -1 ? 99 : item.stockCount;
                            return (
                                <div
                                    key={item.id}
                                    className={`relative bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3 ${
                                        outOfStock ? 'opacity-60 grayscale' : ''
                                    }`}
                                >
                                    {outOfStock && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                            Out of stock
                                        </span>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-100">{item.name}</p>
                                        <p className="text-lg font-bold text-sky-400 mt-1">
                                            {formatNok(effectivePriceInOre(item.priceInOre, vatEnabled) * qty)}
                                            <span className="text-xs font-normal text-gray-500 ml-1">{vatLabel(vatEnabled)}</span>
                                        </p>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                        )}
                                        {item.stockCount !== -1 && item.stockCount > 0 && item.stockCount <= 5 && (
                                            <p className="text-xs text-amber-400 mt-1">Only {item.stockCount} left</p>
                                        )}
                                    </div>

                                    {!outOfStock && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700/40 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => setQty(item.id, qty - 1, max)}
                                                    disabled={qty <= 1}
                                                    aria-label="Decrease quantity"
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <MinusIcon className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-100 w-6 text-center tabular-nums">{qty}</span>
                                                <button
                                                    onClick={() => setQty(item.id, qty + 1, max)}
                                                    disabled={qty >= max}
                                                    aria-label="Increase quantity"
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <PlusIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => openItemModal(item)}
                                                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Buy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            <Section title="Subscription plans">
                {products.length === 0 ? (
                    <p className="text-sm text-gray-500">No plans available.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {products.map(p => {
                            const addOnLocked = p.type === 'AddOn' && !hasActivePrimary;
                            return (
                                <div
                                    key={p.id}
                                    className={`bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3 ${
                                        addOnLocked ? 'opacity-60 grayscale' : ''
                                    }`}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-100">{p.name}</p>
                                        <p className="text-lg font-bold text-sky-400 mt-1">
                                            {formatNok(effectivePriceInOre(p.priceInOre, vatEnabled))}
                                            <span className="text-xs font-normal text-gray-500 ml-1">
                                                / {p.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                                            </span>
                                        </p>
                                        {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
                                        {addOnLocked && (
                                            <p className="text-xs text-amber-400 mt-2">Requires an active primary subscription</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openSubModal(p)}
                                        disabled={addOnLocked}
                                        className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                                            addOnLocked
                                                ? 'bg-gray-700 cursor-not-allowed'
                                                : 'bg-sky-600 hover:bg-sky-500'
                                        }`}
                                    >
                                        Subscribe
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Section>

            {phoneItemModal && (
                <PaymentPhoneModal
                    title="Pay with Vipps"
                    summary={
                        <>
                            <span className="text-gray-300">{phoneItemModal.item.name}</span>
                            {' × '}{phoneItemModal.quantity}
                            {' — '}
                            {formatNok(effectivePriceInOre(phoneItemModal.item.priceInOre, vatEnabled) * phoneItemModal.quantity)} {vatLabel(vatEnabled)}
                        </>
                    }
                    initialPhone={savedPhone}
                    submitting={purchasing}
                    onSubmit={(msisdn) => handleCheckout(phoneItemModal.item, phoneItemModal.quantity, msisdn)}
                    onCancel={() => setPhoneItemModal(null)}
                />
            )}

            {phoneSubModal && (
                <PaymentPhoneModal
                    title="Pay with Vipps"
                    summary={
                        <>
                            <span className="text-gray-300">{phoneSubModal.name}</span>
                            {' — '}
                            {formatNok(effectivePriceInOre(phoneSubModal.priceInOre, vatEnabled))} / {phoneSubModal.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                        </>
                    }
                    requireConsent
                    initialPhone={savedPhone}
                    submitting={purchasing}
                    onSubmit={(msisdn) => handleInitiate(phoneSubModal, msisdn)}
                    onCancel={() => setPhoneSubModal(null)}
                />
            )}

            {redirecting && <RedirectingOverlay />}
        </div>
    );
}
