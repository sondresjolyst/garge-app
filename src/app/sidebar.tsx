"use client"

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { HomeIcon, SignalIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
    return (
        <div className="w-24 sm:w-28 md:w-32 lg:w-42 bg-gray-800 text-gray-200 p-4 sm:p-6 h-screen flex flex-col">
            <div className="container mx-auto flex flex-col items-center">
                <div className="p-2 mt-2 mb-2 flex justify-center">
                    <Link href="/">
                        <div className="hidden md:block">
                            <Image src="/garge-icon-large.png" width={130} height={70} alt="Next.js Logo" />
                        </div>
                        <div className="block md:hidden">
                            <Image src="/garge-icon-small.png" width={130} height={70} alt="Vercel Logo" />
                        </div>
                    </Link>
                </div>
            </div>
            <div className="p-2 sm:p-4 flex flex-col items-center">
                <h3 className="text-sm font-medium uppercase text-gray-400 mb-2 hidden md:block">Navigation</h3>
                <ul className="w-full">
                    <li>
                        <Link href="/" className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center">
                            <HomeIcon className="h-5 w-5 mb-2 md:mb-0" />
                            <span className="hidden md:block">Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/sensors" className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center">
                            <SignalIcon className="h-5 w-5 mb-2 md:mb-0" />
                            <span className="hidden md:block">Sensors</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};
