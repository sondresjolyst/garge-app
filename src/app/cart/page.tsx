"use client"

import React from 'react';
import { useCart } from '@/context/CartContext';
import { XCircleIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/formatPrice';

export default function CartPage() {
    const { cart, removeItem, increaseQuantity, decreaseQuantity, setQuantity } = useCart();

    const total = cart.reduce((sum, item) => {
        if (item.type === 'product') {
            return sum + item.item.price * item.quantity;
        }
        if (item.type === 'subscription') {
            return sum + item.item.price;
        }
        return sum;
    }, 0);

    return (
        <div className="p-8 max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md text-gray-200">
            <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
            {cart.length === 0 ? (
                <div>Your cart is empty.</div>
            ) : (
                <>
                    <ul className="mb-6">
                        {cart.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between mb-4 bg-gray-900 p-4 rounded">
                                <div>
                                    <span className="font-semibold">
                                        {item.type === 'product' ? item.item.name : item.item.name + ' (Subscription)'}
                                    </span>
                                    <div className="text-sm text-gray-400 mt-1 flex items-center">
                                        {item.type === 'product' ? (
                                            <>
                                                <span className="mr-2">Quantity:</span>
                                                <button
                                                    className="mx-1 rounded disabled:opacity-50"
                                                    aria-label="Decrease quantity"
                                                    onClick={() => decreaseQuantity(idx)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <MinusCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                                                </button>
                                                <input
                                                    id={`product-quantity-${item.item.id}`}
                                                    type="tel"
                                                    maxLength={3}
                                                    aria-label="Number of products"
                                                    className="w-12 text-center bg-gray-800 border border-gray-700 rounded mx-1"
                                                    value={item.quantity}
                                                    onChange={e => {
                                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                                        setQuantity(idx, val);
                                                    }}
                                                />
                                                <button
                                                    className="mx-1 rounded"
                                                    aria-label="Increase quantity"
                                                    onClick={() => increaseQuantity(idx)}
                                                >
                                                    <PlusCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                                                </button>
                                            </>
                                        ) : (
                                            <span>
                                                Duration: {item.item.durationMonths} month{item.item.durationMonths > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold">
                                        {item.type === 'product'
                                            ? formatPrice(item.item.price * item.quantity, item.item.currency)
                                            : formatPrice(item.item.price, item.item.currency)}
                                    </span>
                                    <XCircleIcon className="h-6 w-6 text-red-600 cursor-pointer" onClick={() => removeItem(idx)} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mb-6 text-xl font-bold text-right">Total: {formatPrice(total)}</div>
                    <div className="flex justify-end">
                        <button
                            className="gargeBtnActive"
                            onClick={() => alert('Checkout not implemented yet')}
                        >
                            Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
