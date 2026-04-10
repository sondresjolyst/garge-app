"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    return (
        <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-gray-700/50">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">

                <Link href="/" className="flex items-center gap-2.5">
                    <Image src="/garge-icon-large.png" height={36} width={0} style={{ width: 'auto' }} alt="Garge" priority />
                    <span className="text-sm font-semibold text-gray-100 tracking-wide hidden sm:block">Garge</span>
                </Link>

                <nav className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href="/profile"
                                className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-700/60 transition-all"
                            >
                                {session?.user?.name}
                            </Link>
                            <button
                                onClick={() => signOut()}
                                title="Logout"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/60 transition-all"
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                <span className="hidden sm:block">Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/60 transition-all">
                                Sign in
                            </Link>
                            <Link href="/register" className="px-3 py-1.5 rounded-xl text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition-all">
                                Create account
                            </Link>
                        </>
                    )}
                </nav>

            </div>
        </header>
    );
};
