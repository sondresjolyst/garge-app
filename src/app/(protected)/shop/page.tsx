'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon, CheckBadgeIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import MarkdownText from '@/components/MarkdownText';
import TestModeBanner from '@/components/TestModeBanner';
import PaymentPhoneModal from '@/components/PaymentPhoneModal';
import RedirectingOverlay from '@/components/RedirectingOverlay';
import CartFab from '@/components/CartFab';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import AdminService, { AppSettings } from '@/services/adminService';
import ProductService, { Product } from '@/services/productService';
import ShopService, { ShopItem } from '@/services/shopService';
import SubscriptionService from '@/services/subscriptionService';
import UserService from '@/services/userService';
import ShopItemPhotoService from '@/services/shopItemPhotoService';
import type { Photo } from '@/services/photoServiceFactory';
import { formatNok } from '@/lib/formatUtils';
import { effectivePriceInOre, vatLabel } from '@/lib/pricing';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { formatApiError } from '@/lib/errorMessages';
import { CartLine, addToCart, cartItemCount } from '@/lib/cart';

export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [hasActivePrimary, setHasActivePrimary] = useState(false);
    const [loading, setLoading] = useState(true);

    const [phoneSubModal, setPhoneSubModal] = useState<{ product: Product; quantity: number } | null>(null);
    const [subQuantities, setSubQuantities] = useState<Record<number, number>>({});
    const [savedPhone, setSavedPhone] = useLocalStorage('garge-phone', '');
    const [profilePhone, setProfilePhone] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [photos, setPhotos] = useState<Record<number, Photo>>({});

    const [cart, setCart] = useLocalStorage<CartLine[]>('garge-cart-items', []);
    const [cartOpen, setCartOpen] = useState(false);

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
                shopItems.filter(i => i.hasImage).forEach(i => {
                    ShopItemPhotoService.get(i.id).then(p => {
                        if (p) setPhotos(prev => ({ ...prev, [i.id]: p }));
                    });
                });
            })
            .catch(err => toast.error(formatApiError(err, 'Failed to load shop')))
            .finally(() => setLoading(false));
        UserService.getUserProfile()
            .then(u => setProfilePhone(u.phoneNumber ?? ''))
            .catch(() => {});
    }, []);

    const vatEnabled = appSettings?.vatEnabled ?? false;

    function getQty(itemId: number): number {
        return quantities[itemId] ?? 1;
    }

    function setQty(itemId: number, q: number, max: number) {
        const clamped = Math.max(1, Math.min(q, max === -1 ? 99 : max));
        setQuantities(prev => ({ ...prev, [itemId]: clamped }));
    }

    function handleAddToCart(item: ShopItem) {
        const qty = getQty(item.id);
        const next = addToCart(cart, item.id, item.stockCount, qty);
        if (next === cart) {
            toast.error('Cannot add more — stock limit reached.');
            return;
        }
        setCart(next);
        setQuantities(prev => ({ ...prev, [item.id]: 1 }));
        toast.success(`Added ${item.name} to cart`);
    }

    function getSubQty(productId: number): number {
        return subQuantities[productId] ?? 1;
    }

    function setSubQty(productId: number, q: number) {
        const clamped = Math.max(1, Math.min(q, 50));
        setSubQuantities(prev => ({ ...prev, [productId]: clamped }));
    }

    function openSubModal(product: Product, quantity: number) {
        if (product.type === 'AddOn' && !hasActivePrimary) {
            toast.error('Subscribe to the primary plan first.');
            return;
        }
        setPhoneSubModal({ product, quantity });
    }

    async function handleCartCheckout(msisdn: string) {
        if (cart.length === 0) return;
        setPurchasing(true);
        try {
            const res = await ShopService.checkout({
                items: cart.map(l => ({ shopItemId: l.shopItemId, quantity: l.quantity })),
                phoneNumber: msisdn,
            });
            setSavedPhone(msisdn);
            setCart([]);
            setRedirecting(true);
            window.location.href = res.redirectUrl;
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to initiate payment'));
            setPurchasing(false);
        }
    }

    async function handleInitiate(product: Product, quantity: number, msisdn: string) {
        setPurchasing(true);
        try {
            const res = await SubscriptionService.initiateSubscription({
                productId: product.id,
                phoneNumber: msisdn,
                consentToWaiveWithdrawal: true,
                quantity,
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
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 pb-32">
            <h1 className="text-xl font-display font-bold text-gray-100">Shop</h1>

            <TestModeBanner settings={appSettings} />

            {items.length > 0 && (
                <Section title="Products">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(item => {
                            const outOfStock = item.stockCount === 0;
                            const qty = getQty(item.id);
                            const max = item.stockCount === -1 ? 99 : item.stockCount;
                            const photo = photos[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className={`relative bg-gray-900/40 border border-gray-700/30 rounded-xl overflow-hidden flex flex-col ${
                                        outOfStock ? 'opacity-60 grayscale' : ''
                                    }`}
                                >
                                    {photo && (
                                        <div className="aspect-video bg-gray-800/40 overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`data:${photo.contentType};base64,${photo.data}`}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    {outOfStock && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                            Out of stock
                                        </span>
                                    )}
                                    <div className="flex-1 flex flex-col gap-3 p-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-100">{item.name}</p>
                                            <p className="text-lg font-bold text-sky-400 mt-1">
                                                {formatNok(effectivePriceInOre(item.priceInOre, vatEnabled) * qty)}
                                                <span className="text-xs font-normal text-gray-500 ml-1">{vatLabel(vatEnabled)}</span>
                                            </p>
                                            {item.description && (
                                                <div className="mt-1">
                                                    <MarkdownText>{item.description}</MarkdownText>
                                                </div>
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
                                                    onClick={() => handleAddToCart(item)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    <ShoppingCartIcon className="h-4 w-4" />
                                                    Add to cart
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {products.length > 0 && (
                <Section title="Subscription plans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {products.map(p => {
                            const isPrimary = p.type === 'Primary';
                            const primaryActive = isPrimary && hasActivePrimary;
                            const addOnLocked = !isPrimary && !hasActivePrimary;
                            const dimmed = primaryActive || addOnLocked;
                            const subQty = isPrimary ? 1 : getSubQty(p.id);
                            const lineTotal = effectivePriceInOre(p.priceInOre, vatEnabled) * subQty;
                            return (
                                <div
                                    key={p.id}
                                    className={`bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex flex-col gap-3 ${
                                        dimmed ? 'opacity-60 grayscale' : ''
                                    }`}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-100">{p.name}</p>
                                        <p className="text-lg font-bold text-sky-400 mt-1">
                                            {formatNok(lineTotal)}
                                            <span className="text-xs font-normal text-gray-500 ml-1">
                                                / {p.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                                            </span>
                                        </p>
                                        {p.description && (
                                            <div className="mt-1">
                                                <MarkdownText>{p.description}</MarkdownText>
                                            </div>
                                        )}
                                        {addOnLocked && (
                                            <p className="text-xs text-amber-400 mt-2">Requires an active primary subscription</p>
                                        )}
                                    </div>

                                    {primaryActive ? (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 text-xs font-semibold">
                                                <CheckBadgeIcon className="h-4 w-4" />
                                                Active
                                            </span>
                                            <Link
                                                href="/profile/billing"
                                                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                                            >
                                                Manage →
                                            </Link>
                                        </div>
                                    ) : !isPrimary && !addOnLocked ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700/40 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => setSubQty(p.id, subQty - 1)}
                                                    disabled={subQty <= 1}
                                                    aria-label="Decrease quantity"
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <MinusIcon className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-100 w-6 text-center tabular-nums">{subQty}</span>
                                                <button
                                                    onClick={() => setSubQty(p.id, subQty + 1)}
                                                    disabled={subQty >= 50}
                                                    aria-label="Increase quantity"
                                                    className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <PlusIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => openSubModal(p, subQty)}
                                                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                {subQty > 1 ? `Subscribe × ${subQty}` : 'Subscribe'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => openSubModal(p, 1)}
                                            disabled={addOnLocked}
                                            className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                                                addOnLocked
                                                    ? 'bg-gray-700 cursor-not-allowed'
                                                    : 'bg-sky-600 hover:bg-sky-500'
                                            }`}
                                        >
                                            Subscribe
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {items.length === 0 && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-900/40 border border-gray-700/30 rounded-2xl">
                    <BuildingStorefrontIcon className="h-12 w-12 text-gray-700 mb-3" />
                    <p className="text-sm font-medium text-gray-300">Shop is empty</p>
                    <p className="text-xs text-gray-500 mt-1">No products or subscriptions are available right now. Check back later.</p>
                </div>
            )}

            <CartFab count={cartItemCount(cart)} onClick={() => setCartOpen(true)} />

            <CartDrawer
                open={cartOpen}
                cart={cart}
                items={items}
                vatEnabled={vatEnabled}
                initialPhone={profilePhone || savedPhone}
                submitting={purchasing}
                onChange={setCart}
                onClose={() => setCartOpen(false)}
                onCheckout={handleCartCheckout}
            />

            {phoneSubModal && (
                <PaymentPhoneModal
                    title="Pay with Vipps"
                    summary={
                        <>
                            <span className="text-gray-300">{phoneSubModal.product.name}</span>
                            {phoneSubModal.quantity > 1 && <> {' × '}{phoneSubModal.quantity}</>}
                            {' — '}
                            {formatNok(effectivePriceInOre(phoneSubModal.product.priceInOre, vatEnabled) * phoneSubModal.quantity)} / {phoneSubModal.product.interval === 'Monthly' ? 'month' : 'year'} · {vatLabel(vatEnabled)}
                        </>
                    }
                    requireConsent
                    initialPhone={profilePhone || savedPhone}
                    submitting={purchasing}
                    onSubmit={(msisdn) => handleInitiate(phoneSubModal.product, phoneSubModal.quantity, msisdn)}
                    onCancel={() => setPhoneSubModal(null)}
                />
            )}

            {redirecting && <RedirectingOverlay />}
        </div>
    );
}
