"use client"

import React from "react";
import Link from "next/link";

export default function DocumentationPage() {
    return (
        <div className="p-6 max-w-3xl mx-auto text-gray-200">
            <h1 className="text-3xl font-bold mb-4">Garge Device Documentation</h1>
            <p className="mb-6">
                Welcome to the official documentation for Garge devices. Here you will find setup instructions, usage tips, and troubleshooting help for all Garge products.
            </p>

            {/* Setup Instructions */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Setup Instructions</h2>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Unbox your <strong>Garge device</strong>.</li>
                    <li>Place the device in your desired location (e.g., storage room, garage, or near the battery to monitor).</li>
                    <li>Power on the device according to the included instructions.</li>
                    <li>Connect the device to your Wi-Fi network using the Garge mobile app or web setup.</li>
                    <li>Log in to the Garge web dashboard to view your data.</li>
                </ol>
            </section>

            {/* Usage */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Using Your Garge Device</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li>Monitor real-time temperature, humidity, and battery voltage (depending on device type).</li>
                    <li>Access historical data and trends from the dashboard.</li>
                    <li>Use the dashboard to manage multiple devices and view their status.</li>
                </ul>
            </section>

            {/* Troubleshooting */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Troubleshooting</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Device not connecting:</strong> Ensure your Wi-Fi credentials are correct and the device is within range.</li>
                    <li><strong>No data in dashboard:</strong> Check that the device is powered on and connected to the network.</li>
                    <li><strong>Still need help?</strong> Contact support or check the FAQ on the <Link href="/" className="text-blue-400 underline">homepage</Link>.</li>
                </ul>
            </section>

            {/* Back to Home */}
            <div className="mt-8">
                <Link href="/" className="text-blue-400 underline">
                    &larr; Back to Home
                </Link>
            </div>
        </div>
    );
}
