"use client"

import React from 'react';
import Image from 'next/image';
import TimeSeriesChart from '@/components/TimeSeriesChart';

const demoData = [
    { x: Math.floor(new Date('2024-01-01').getTime()), y: 12 },
    { x: Math.floor(new Date('2024-02-01').getTime()), y: 19 },
    { x: Math.floor(new Date('2024-03-01').getTime()), y: 3 },
    { x: Math.floor(new Date('2024-04-01').getTime()), y: 5 },
    { x: Math.floor(new Date('2024-05-01').getTime()), y: 2 },
    { x: Math.floor(new Date('2024-06-01').getTime()), y: 3 },
];

export default function HomePage() {
    return (
        <div className="p-4 space-y-8 bg-gray-700 text-gray-200 shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6">
                <h1 className="text-3xl font-bold mb-2">Welcome to Garge!</h1>
                <p className="text-lg mb-2">
                    Monitor temperature, humidity, and battery voltage.
                </p>
                <p className="text-md">
                    <span className="font-semibold">Now compatible with Wiz sockets!</span>
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-4 flex flex-col items-center">
                    <Image className="object-cover" width={256} height={256} src="/garge-box-v1.1/liz-sensor-v1.1-box-explode-transparent.png" alt="Garge Sensor Box Exploded" />
                    <span className="mt-2 text-sm">Exploded view of the Garge Sensor Box</span>
                </div>
                <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-4 flex flex-col items-center">
                    <Image className="object-cover" width={256} height={256} src="/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png" alt="Garge Sensor Box" />
                    <span className="mt-2 text-sm">Assembled Garge Sensor Box</span>
                </div>
            </div>

            <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-2">Key Features</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>Real-time temperature monitoring</li>
                    <li>Humidity tracking for optimal storage</li>
                    <li>Battery voltage monitoring</li>
                    <li>Easy integration with Wiz sockets</li>
                </ul>
            </div>

            <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-hidden">
                <div className="p-4">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                        Demo Sensor Data Visualization
                    </h3>
                </div>
                <div className="p-4">
                    <TimeSeriesChart title="Demo Data" data={demoData} />
                </div>
            </div>
        </div>
    );
}
