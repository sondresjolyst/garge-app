"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import productService, { Product } from '@/services/productService';
import subscriptionService, { Subscription } from '@/services/subscriptionService';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';

const DEFAULT_IMAGE = '/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const { addProduct, addSubscription } = useCart();

    useEffect(() => {
        Promise.all([
            productService.getAllProducts(),
            subscriptionService.getAllSubscriptions()
        ])
            .then(([products, subscriptions]) => {
                setProducts(products);
                setSubscriptions(subscriptions);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4 space-y-8 text-gray-200 rounded-lg overflow-hidden">
            <div className="text-gray-200 p-6 flex flex-col">
                <h1 className="text-3xl font-bold mb-2">Garge Shop</h1>
                <p className="text-lg mb-2">
                    Choose your Garge device and subscribe.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {products.map(product => (
                    <div key={`product-${product.id}`} className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6 flex flex-col items-center">
                        <Image
                            className="object-cover"
                            width={128}
                            height={128}
                            src={DEFAULT_IMAGE}
                            alt={product.name}
                        />
                        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                        <p className="mb-4 text-center">{product.description}</p>
                        <span className="block mb-4 font-bold">
                            {formatPrice(product.price, product.currency)}
                        </span>
                        <button className="gargeBtnActive" onClick={() => addProduct(product)}>
                            Buy {product.name}
                        </button>
                    </div>
                ))}
                {subscriptions.map(subscription => (
                    <div key={`subscription-${subscription.id}`} className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6 flex flex-col items-center">
                        <PresentationChartLineIcon className="h-16 w-16 mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold mb-2">{subscription.name}</h2>
                        <p className="mb-4 text-center">{subscription.description}</p>
                        <span className="block mb-4 font-bold">
                            {formatPrice(subscription.price, subscription.currency)} / {subscription.durationMonths} month{subscription.durationMonths > 1 ? 's' : ''}
                        </span>
                        <button className="gargeBtnActive" onClick={() => addSubscription(subscription)}>
                            Subscribe
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
