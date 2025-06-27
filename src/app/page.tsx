"use client"

import React from 'react';
import Image from 'next/image';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const demoData = [
    { x: Math.floor(new Date('2024-01-01').getTime()), y: 12 },
    { x: Math.floor(new Date('2024-02-01').getTime()), y: 19 },
    { x: Math.floor(new Date('2024-03-01').getTime()), y: 3 },
    { x: Math.floor(new Date('2024-04-01').getTime()), y: 5 },
    { x: Math.floor(new Date('2024-05-01').getTime()), y: 2 },
    { x: Math.floor(new Date('2024-06-01').getTime()), y: 3 },
];

const demoSockets = [
    { name: 'Wiz Socket 1', state: 'ON' },
    { name: 'Wiz Socket 2', state: 'OFF' },
    { name: 'Wiz Socket 3', state: 'ON' },
    { name: 'Wiz Socket 4', state: 'UNKNOWN' },
];

const stateIcon = (state: string) => {
    switch (state) {
        case 'ON':
            return <PlusCircleIcon className="h-8 w-8 fill-green-400" title="On" />;
        case 'OFF':
            return <PlusCircleIcon className="h-8 w-8 fill-red-400" title="Off" />;
        default:
            return <PlusCircleIcon className="h-8 w-8 fill-zinc-400" title="Unknown" />;
    }
};

export default function HomePage() {
    return (
        <div className="p-4 space-y-8 text-gray-200 shadow-md rounded-lg overflow-hidden">
            <div className="text-gray-200 p-6 flex flex-col">
                <h1 className="text-3xl font-bold mb-2">Welcome to Garge!</h1>
                <p className="text-lg mb-2">
                    Monitor temperature, humidity, and battery voltage.
                </p>
            </div>

            <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Key Features</h2>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Real-time temperature monitoring</li>
                            <li>Humidity tracking for optimal storage</li>
                            <li>Battery voltage monitoring</li>
                        </ul>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center h-full">
                        <div className="bg-gray-700 text-gray-200 shadow-md rounded-lg p-4 flex flex-col items-center">
                            <Image className="object-cover" width={256} height={256} src="/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png" alt="Garge Sensor" />
                            <span className="mt-2 text-sm">Assembled Garge Sensor</span>
                        </div>
                        <div className="bg-gray-700 text-gray-200 shadow-md rounded-lg p-4 flex flex-col items-center">
                            <Image className="object-cover" width={256} height={256} src="/garge-box-v1.1/liz-sensor-v1.1-box-explode-transparent.png" alt="Garge Sensor Exploded" />
                            <span className="mt-2 text-sm">Exploded view of the Garge Sensor</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">Demo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-800 text-gray-200 shadow-md rounded-lg p-6">
                        <h4 className="text-xl font-semibold mb-2">Demo Sensor</h4>
                        <TimeSeriesChart title="Demo Data" data={demoData} />
                    </div>
                    <div className="text-gray-200 p-6">
                        <h4 className="text-xl font-semibold mb-2">Demo Sockets</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {demoSockets.map((socket, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-hidden flex items-center p-4"
                                >
                                    <div className="flex-1">
                                        <h5 className="text-lg font-bold">{socket.name}</h5>
                                        <span className="block text-sm text-gray-400">Status: {socket.state}</span>
                                    </div>
                                    {stateIcon(socket.state)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
