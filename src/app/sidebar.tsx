import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default async function Sidebar() {
    return (
        <div className="w-1/6 bg-gray-800 text-gray-200 p-6 h-screen flex flex-col">
            <div className="container mx-auto p-4 flex flex-col items-center">
                <div className="mb-8 p-2">
                    <Link href="/">
                        <Image src="/next.svg" width={130} height={70} alt="Next.js Logo" />
                    </Link>
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-sm font-medium uppercase text-gray-400 mb-2">Navigation</h3>
                <ul>
                    <li>
                        <Link href="/" className="block text-gray-200 hover:text-white p-2">
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link href={`/sensors`} className="block text-gray-200 hover:text-white p-2">
                            Sensors
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};
