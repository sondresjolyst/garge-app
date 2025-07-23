"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/formatPrice";
import { useRouter } from "next/navigation";
import orderService from "@/services/orderService";

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: "",
        street: "",
        postalCode: "",
        city: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const total = cart.reduce((sum, item) => {
        if (item.type === "product") {
            return sum + item.item.price * item.quantity;
        }
        if (item.type === "subscription") {
            return sum + item.item.price;
        }
        return sum;
    }, 0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            !form.name ||
            !form.email ||
            !form.mobile ||
            !form.street ||
            !form.postalCode ||
            !form.city
        ) return;

        const products = cart
            .filter(item => item.type === "product")
            .map(item => ({
                productId: item.item.id,
                quantity: item.quantity,
            }));

        const subscriptions = cart
            .filter(item => item.type === "subscription")
            .map(item => ({
                subscriptionId: item.item.id,
            }));

        try {
            await orderService.createOrder({
                name: form.name,
                email: form.email,
                mobile: form.mobile,
                street: form.street,
                postalCode: form.postalCode,
                city: form.city,
                products,
                subscriptions,
            });
            clearCart();
            router.push("/shop");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            alert(err.message || "Order failed");
        }
    };

    return (
        <div className="p-4 space-y-8 text-gray-200 rounded-lg overflow-hidden">
            <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-2">Checkout</h1>
                <p className="text-lg">Enter your details and review your order.</p>
            </div>
            <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="name">Name</label>
                        <input
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                        {submitted && !form.name && <span className="text-red-400 text-sm">Name is required</span>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="email">Email</label>
                        <input
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        {submitted && !form.email && <span className="text-red-400 text-sm">Email is required</span>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="mobile">Mobile Number</label>
                        <input
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={form.mobile}
                            onChange={handleChange}
                            required
                        />
                        {submitted && !form.mobile && <span className="text-red-400 text-sm">Mobile number is required</span>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="street">Street</label>
                        <input
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                            type="text"
                            id="street"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            required
                        />
                        {submitted && !form.street && <span className="text-red-400 text-sm">Street is required</span>}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block mb-1 font-semibold" htmlFor="postalCode">Postal Code</label>
                            <input
                                className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={form.postalCode}
                                onChange={handleChange}
                                required
                            />
                            {submitted && !form.postalCode && <span className="text-red-400 text-sm">Postal code is required</span>}
                        </div>
                        <div className="flex-1">
                            <label className="block mb-1 font-semibold" htmlFor="city">City</label>
                            <input
                                className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 w-full"
                                type="text"
                                id="city"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                required
                            />
                            {submitted && !form.city && <span className="text-red-400 text-sm">City is required</span>}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mt-8 mb-2">Order Summary</h2>
                    <ul className="mb-4 divide-y divide-gray-700">
                        {cart.map((item, idx) => (
                            <li key={idx} className="flex justify-between py-2">
                                <span>
                                    {item.type === "product"
                                        ? `${item.item.name} x${item.quantity}`
                                        : `${item.item.name} (Subscription)`}
                                </span>
                                <span>
                                    {item.type === "product"
                                        ? formatPrice(item.item.price * item.quantity, item.item.currency)
                                        : formatPrice(item.item.price, item.item.currency)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="text-right text-lg font-bold mb-4">
                        Total: {formatPrice(total)}
                    </div>
                    <button type="submit" className="gargeBtnActive w-full">
                        Place Order
                    </button>
                </form>
            </div>
        </div>
    );
}
