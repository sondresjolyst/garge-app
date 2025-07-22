"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/services/productService';
import { Subscription } from '@/services/subscriptionService';

export type CartItem =
    | { type: 'product'; item: Product; quantity: number }
    | { type: 'subscription'; item: Subscription; quantity: number };

interface CartContextType {
    cart: CartItem[];
    addProduct: (product: Product) => void;
    addSubscription: (subscription: Subscription) => void;
    removeItem: (index: number) => void;
    clearCart: () => void;
    increaseQuantity: (index: number) => void;
    decreaseQuantity: (index: number) => void;
    setQuantity: (index: number, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('cart');
        if (stored) {
            setCart(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addProduct = (product: Product) => {
        setCart(prev => {
            const idx = prev.findIndex(
                i => i.type === 'product' && i.item.id === product.id
            );
            if (idx > -1) {
                // Increment quantity
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    quantity: updated[idx].quantity + 1,
                };
                return updated;
            }
            return [...prev, { type: 'product', item: product, quantity: 1 }];
        });
    };

    const addSubscription = (subscription: Subscription) => {
        // Only one subscription of each type allowed
        setCart(prev => {
            if (prev.some(i => i.type === 'subscription' && i.item.id === subscription.id)) {
                return prev;
            }
            return [...prev, { type: 'subscription', item: subscription, quantity: 1 }];
        });
    };

    const removeItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => setCart([]);

    const increaseQuantity = (index: number) => {
        setCart(prev => prev.map((item, i) =>
            i === index && item.type === 'product'
                ? { ...item, quantity: item.quantity + 1 }
                : item
        ));
    };

    const decreaseQuantity = (index: number) => {
        setCart(prev => prev.map((item, i) =>
            i === index && item.type === 'product' && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item
        ));
    };

    const setQuantity = (index: number, quantity: number) => {
        setCart(prev => prev.map((item, i) =>
            i === index && item.type === 'product'
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
        ));
    };

    return (
        <CartContext.Provider value={{
            cart, addProduct, addSubscription, removeItem, clearCart, increaseQuantity, decreaseQuantity, setQuantity
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
