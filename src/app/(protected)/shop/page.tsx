'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import { toast } from 'sonner';
import AdminService, { AppSettings } from '@/services/adminService';
import ProductService, { Product } from '@/services/productService';
import ShopService, { ShopItem } from '@/services/shopService';
import SubscriptionService from '@/services/subscriptionService';
import { formatNok } from '@/lib/formatUtils';

function effectivePrice(priceInOre: number, vatEnabled: boolean): number {
    return vatEnabled ? Math.round(priceInOre * 1.25) : priceInOre;
}

function vatLabel(vatEnabled: boolean): string {
    return vatEnabled ? 'inkl. mva' : 'ekskl. mva';
}

function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('47') && digits.length >= 10) return digits;
    if (digits.length === 8) return `47${digits}`;
    return digits;
}

export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const [phoneItemModal, setPhoneItemModal] = useState<ShopItem | null>(null);
    const [phoneSubModal, setPhoneSubModal] = useState<Product | null>(null);
    const [phone, setPhone] = useState('');
    const [agreedWithdrawal, setAgreedWithdrawal] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        Promise.all([
            ShopService.getShopItems(),
            ProductService.getProducts(),
            AdminService.getAppSettings(),
        ])
            .then(([shopItems, prods, settings]) => {
                setItems(shopItems);
                setProducts(prods);
                setAppSettings(settings);
            })
            .catch(() => toast.error('Failed to load shop'))
            .finally(() => setLoading(false));
    }, []);

    const vatEnabled = appSettings?.vatEnabled ?? false;

    async function handleCheckout(item: ShopItem) {
        if (!phone.trim()) { toast.error('Phone number required'); return; }
        setPurchasing(true);
        try {
            const res = await ShopService.checkout({
                items: [{ shopItemId: item.id, quantity: 1 }],
                phoneNumber: phone.trim(),
                redirectUrl: `${window.location.origin}/shop/return`,
            });
            window.location.href = res.redirectUrl;
        } catch {
            toast.error('Failed to initiate payment');
            setPurchasing(false);
        }
    }

    async function handleInitiate(product: Product) {
        if (!phone.trim()) { toast.error('Phone number required'); return; }
        setPurchasing(true);
        try {
            const res = await SubscriptionService.initiateSubscription({
                productId: product.id,
                phoneNumber: normalizePhone(phone),
                redirectUrl: `${window.location.origin}/profile/billing/return`,
            });
            window.location.href = res.vippsConfirmationUrl;
        } catch {
            toast.error('Failed to initiate subscription');
            setPurchasing(false);
        }
    }

    if (loading) return <LoadingDots height="h-64" />;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
            <h1 className="text-xl font-display font-bold text-gray-100">Shop</h1>

            {appSettings?.vippsTestMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-amber-400">Vipps test mode is active — no real payments will be processed</p>
                </div>
            )}

            {items.length > 0 && (
                <Section title="Products">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-100">{item.name}</p>
                                    <p className="text-lg font-bold text-sky-400 mt-1">
                                        {formatNok(effectivePrice(item.priceInOre, vatEnabled))}
                                        <span className="text-xs font-normal text-gray-500 ml-1">{vatLabel(vatEnabled)}</span>
                                    </p>
                                    {item.description && (
                                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    )}
                                    {item.stockCount !== -1 && item.stockCount > 0 && item.stockCount <= 5 && (
                                        <p className="text-xs text-amber-400 mt-1">Only {item.stockCount} left</p>
                                    )}
                                    {item.stockCount === 0 && (
                                        <p className="text-xs text-red-400 mt-1">Out of stock</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setPhoneItemModal(item); setPhone(''); }}
                                    disabled={item.stockCount === 0}
                                    className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Buy
                                </button>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            <Section title="Subscription plans">
                {products.length === 0 ? (
                    <p className="text-sm text-gray-500">No plans available.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {products.map(p => (
                            <div key={p.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-100">{p.name}</p>
                                    <p className="text-lg font-bold text-sky-400 mt-1">
                                        {formatNok(effectivePrice(p.priceInOre, vatEnabled))}
                                        <span className="text-xs font-normal text-gray-500 ml-1">
                                            / {p.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                                        </span>
                                    </p>
                                    {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
                                </div>
                                <button
                                    onClick={() => { setPhoneSubModal(p); setPhone(''); setAgreedWithdrawal(false); }}
                                    className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Subscribe
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Hardware purchase modal */}
            {phoneItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm space-y-4">
                        <p className="text-sm font-semibold text-gray-100">Pay with Vipps</p>
                        <p className="text-xs text-gray-500">
                            <span className="text-gray-300">{phoneItemModal.name}</span> — {formatNok(effectivePrice(phoneItemModal.priceInOre, vatEnabled))} {vatLabel(vatEnabled)}
                        </p>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Phone number"
                            className="w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCheckout(phoneItemModal)}
                                disabled={purchasing}
                                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {purchasing ? 'Redirecting…' : 'Continue to Vipps'}
                            </button>
                            <button
                                onClick={() => setPhoneItemModal(null)}
                                className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscription purchase modal */}
            {phoneSubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm space-y-4">
                        <p className="text-sm font-semibold text-gray-100">Pay with Vipps</p>
                        <p className="text-xs text-gray-500">
                            <span className="text-gray-300">{phoneSubModal.name}</span>
                            {' — '}
                            {formatNok(effectivePrice(phoneSubModal.priceInOre, vatEnabled))} / {phoneSubModal.interval === 'Monthly' ? 'month' : 'year'}
                            {' '}· {vatLabel(vatEnabled)}
                        </p>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Phone number"
                            className="w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                        />
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreedWithdrawal}
                                onChange={e => setAgreedWithdrawal(e.target.checked)}
                                className="mt-0.5 accent-sky-500 shrink-0"
                            />
                            <span className="text-xs text-gray-500 leading-relaxed">
                                I request immediate access and waive my 14-day right of withdrawal (angrerettloven).
                            </span>
                        </label>
                        <p className="text-xs text-gray-600">
                            By continuing you accept our{' '}
                            <Link href="/terms" className="text-sky-500 hover:text-sky-400 transition-colors">Terms of Service</Link>.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleInitiate(phoneSubModal)}
                                disabled={purchasing || !agreedWithdrawal}
                                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {purchasing ? 'Redirecting…' : 'Continue to Vipps'}
                            </button>
                            <button
                                onClick={() => setPhoneSubModal(null)}
                                className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
