import React from 'react';
import Image from 'next/image';

const products = [
    {
        id: 'garge-sensor',
        name: 'Garge Sensor',
        description: 'Monitors temperature and humidity in real time.',
        price: 49.99,
        image: '/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png',
        buttonText: 'Buy Garge Sensor',
    },
    {
        id: 'garge-voltmeter',
        name: 'Garge Voltmeter',
        description: 'Monitors battery voltage.',
        price: 49.99,
        image: '/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png',
        buttonText: 'Buy Garge Voltmeter',
    },
    {
        id: 'subscription',
        name: 'Subscription',
        description: 'Get real-time alerts and advanced features for your sensors.',
        price: 4.99,
        image: '',
        buttonText: 'Subscribe',
        isSubscription: true,
    },
];

export default function ShopPage() {
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
                    <div key={product.id} className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6 flex flex-col items-center">
                        {product.image && (
                            <Image className="object-cover" width={128} height={128} src={product.image} alt={product.name} />
                        )}
                        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                        <p className="mb-4 text-center">{product.description}</p>
                        <span className="block mb-4 font-bold">
                            {product.isSubscription ? `$${product.price}/month` : `$${product.price}`}
                        </span>
                        <button className="gargeBtnActive">
                            {product.buttonText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
