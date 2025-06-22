"use client"

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { HomeIcon, SignalIcon, BoltIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
    return (
        <div className="w-24 sm:w-24 md:w-30 lg:w-32 bg-gray-800 text-gray-200 p-4 h-screen flex flex-col">
            <div className="container mx-auto flex flex-col items-center">
                <div className="p-2 mt-2 mb-2 flex justify-center">
                    <Link href="/" passHref>
                        <div className="cursor-pointer">
                            <div className="hidden md:block">
                                <Image src="/garge-icon-large.png" width={130} height={70} alt="Garge Logo" />
                            </div>
                            <div className="block md:hidden">
                                <Image src="/garge-icon-small.png" width={130} height={70} alt="Garge Logo" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
            <div className="p-2 sm:p-4 flex flex-col items-center">
                <h3 className="text-sm font-medium uppercase text-gray-400 mb-2 hidden md:block">Navigation</h3>
                <ul className="w-full">
                    <li>
                        <Link href="/" passHref>
                            <div className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center cursor-pointer">
                                <HomeIcon className="h-8 w-8 mb-2 md:mb-0" />
                                <span className="hidden md:block">Home</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/sensors" passHref>
                            <div className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center cursor-pointer">
                                <SignalIcon className="h-8 w-8 mb-2 md:mb-0" />
                                <span className="hidden md:block">Sensors</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/sockets" passHref>
                            <div className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center cursor-pointer">
                                <PlusCircleIcon className="h-8 w-8 mb-2 md:mb-0" />
                                <span className="hidden md:block">Sockets</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/electricity" passHref>
                            <div className="block text-gray-200 hover:text-white p-2 flex flex-col items-center justify-center cursor-pointer">
                                <BoltIcon className="h-8 w-8 mb-2 md:mb-0" />
                                <span className="hidden md:block">Electricity</span>
                            </div>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};
