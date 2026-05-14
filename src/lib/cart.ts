import { effectivePriceInOre } from '@/lib/pricing';

export interface CartLine {
    shopItemId: number;
    quantity: number;
}

export function clampToStock(qty: number, stockCount: number): number {
    if (stockCount <= 0) return 0;
    if (qty < 1) return 0;
    return Math.min(qty, stockCount);
}

export function addToCart(cart: CartLine[], itemId: number, stockCount: number, delta = 1): CartLine[] {
    if (stockCount <= 0 || delta <= 0) return cart;
    const existing = cart.find(l => l.shopItemId === itemId);
    if (existing) {
        const nextQty = clampToStock(existing.quantity + delta, stockCount);
        if (nextQty === 0) return cart.filter(l => l.shopItemId !== itemId);
        return cart.map(l => l.shopItemId === itemId ? { ...l, quantity: nextQty } : l);
    }
    const startQty = clampToStock(delta, stockCount);
    if (startQty === 0) return cart;
    return [...cart, { shopItemId: itemId, quantity: startQty }];
}

export function setLineQty(cart: CartLine[], itemId: number, qty: number, stockCount: number): CartLine[] {
    const clamped = clampToStock(qty, stockCount);
    if (clamped === 0) return cart.filter(l => l.shopItemId !== itemId);
    if (!cart.some(l => l.shopItemId === itemId)) {
        return [...cart, { shopItemId: itemId, quantity: clamped }];
    }
    return cart.map(l => l.shopItemId === itemId ? { ...l, quantity: clamped } : l);
}

export function removeLine(cart: CartLine[], itemId: number): CartLine[] {
    return cart.filter(l => l.shopItemId !== itemId);
}

export function cartTotalInOre(
    lines: { priceInOre: number; quantity: number }[],
    vatEnabled: boolean,
): number {
    const subtotal = lines.reduce((sum, l) => sum + l.priceInOre * l.quantity, 0);
    return effectivePriceInOre(subtotal, vatEnabled);
}

export function cartItemCount(cart: CartLine[]): number {
    return cart.reduce((sum, l) => sum + l.quantity, 0);
}
