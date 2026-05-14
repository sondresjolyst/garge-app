import { describe, it, expect } from 'vitest';
import {
    addToCart,
    setLineQty,
    removeLine,
    clampToStock,
    cartTotalInOre,
    cartItemCount,
    CartLine,
} from '@/lib/cart';

describe('clampToStock', () => {
    it('returns 0 for stock <= 0', () => {
        expect(clampToStock(5, 0)).toBe(0);
        expect(clampToStock(5, -1)).toBe(0);
    });

    it('returns 0 for qty < 1', () => {
        expect(clampToStock(0, 10)).toBe(0);
        expect(clampToStock(-3, 10)).toBe(0);
    });

    it('caps qty to stock', () => {
        expect(clampToStock(15, 10)).toBe(10);
    });

    it('returns qty when within bounds', () => {
        expect(clampToStock(3, 10)).toBe(3);
    });
});

describe('addToCart', () => {
    it('adds new line when item not in cart', () => {
        const cart: CartLine[] = [];
        const next = addToCart(cart, 1, 10);
        expect(next).toEqual([{ shopItemId: 1, quantity: 1 }]);
    });

    it('increments existing line', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 2 }];
        const next = addToCart(cart, 1, 10);
        expect(next).toEqual([{ shopItemId: 1, quantity: 3 }]);
    });

    it('clamps existing line increment to stock', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 4 }];
        const next = addToCart(cart, 1, 5, 10);
        expect(next).toEqual([{ shopItemId: 1, quantity: 5 }]);
    });

    it('ignores add when stock is 0', () => {
        const cart: CartLine[] = [];
        expect(addToCart(cart, 1, 0)).toBe(cart);
    });

    it('respects delta param', () => {
        expect(addToCart([], 1, 10, 3)).toEqual([{ shopItemId: 1, quantity: 3 }]);
    });

    it('does not mutate the cart', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 1 }];
        addToCart(cart, 1, 10);
        expect(cart).toEqual([{ shopItemId: 1, quantity: 1 }]);
    });
});

describe('setLineQty', () => {
    it('removes line when qty <= 0', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 2 }, { shopItemId: 2, quantity: 1 }];
        expect(setLineQty(cart, 1, 0, 10)).toEqual([{ shopItemId: 2, quantity: 1 }]);
    });

    it('clamps to stock', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 2 }];
        expect(setLineQty(cart, 1, 99, 5)).toEqual([{ shopItemId: 1, quantity: 5 }]);
    });

    it('updates qty for existing line', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 2 }];
        expect(setLineQty(cart, 1, 7, 10)).toEqual([{ shopItemId: 1, quantity: 7 }]);
    });
});

describe('removeLine', () => {
    it('removes matching line', () => {
        const cart: CartLine[] = [{ shopItemId: 1, quantity: 2 }, { shopItemId: 2, quantity: 1 }];
        expect(removeLine(cart, 1)).toEqual([{ shopItemId: 2, quantity: 1 }]);
    });

    it('is a no-op when id not present', () => {
        const cart: CartLine[] = [{ shopItemId: 2, quantity: 1 }];
        expect(removeLine(cart, 99)).toEqual([{ shopItemId: 2, quantity: 1 }]);
    });
});

describe('cartTotalInOre', () => {
    it('sums lines without VAT', () => {
        const total = cartTotalInOre([
            { priceInOre: 1000, quantity: 2 },
            { priceInOre: 500, quantity: 3 },
        ], false);
        expect(total).toBe(3500);
    });

    it('applies VAT once on the subtotal', () => {
        const total = cartTotalInOre([
            { priceInOre: 1000, quantity: 2 },
        ], true);
        expect(total).toBe(2500);
    });

    it('returns 0 for empty cart', () => {
        expect(cartTotalInOre([], false)).toBe(0);
        expect(cartTotalInOre([], true)).toBe(0);
    });
});

describe('cartItemCount', () => {
    it('returns 0 for empty cart', () => {
        expect(cartItemCount([])).toBe(0);
    });

    it('sums quantities across lines', () => {
        expect(cartItemCount([{ shopItemId: 1, quantity: 2 }, { shopItemId: 2, quantity: 3 }])).toBe(5);
    });
});
