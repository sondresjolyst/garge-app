"use client"

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/formatPrice';

export default function Navbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const { cart } = useCart();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => {
        if (item.type === 'product') {
            return sum + item.item.price * item.quantity;
        }
        if (item.type === 'subscription') {
            return sum + item.item.price;
        }
        return sum;
    }, 0);

    return (
        <div className="sticky top-0 bg-gray-700 shadow-md text-gray-200 p-4 z-40">
            <div className="container ml-auto flex">
                <nav className="flex items-center space-x-4 ml-auto">
                    <div className="flex flex-col items-center relative">
                        <Link href="/cart" className="relative">
                            <ShoppingBagIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] rounded-full px-1 py-0.5 font-bold min-w-[16px] text-center">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="mt-1 text-xs text-gray-200 hover:text-gray-400 font-semibold">
                            {totalItems > 0 ? `${formatPrice(totalPrice)}` : 'Cart'}
                        </Link>
                    </div>
                    {isAuthenticated ? (
                        <>
                            <ul className="flex space-x-4">
                                {session?.user && <li>{session.user.name}</li>}
                                <li><Link className="text-gray-400 hover:text-gray-500" href={`/profile`}>Profile</Link></li>
                            </ul>
                            <button className="ml-4 gargeBtnActive" onClick={() => signOut()}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link className="ml-4 gargeBtnActive" href={`/register`}>Register</Link>
                            <Link className="ml-4 gargeBtnActive" href={`/login`}>Login</Link>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
};
