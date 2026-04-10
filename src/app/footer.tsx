"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="border-t border-gray-800/60 bg-gray-900/80 backdrop-blur-xl pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 flex flex-col items-center text-center">

                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <Image src="/garge-icon-large.png" height={32} width={0} style={{ width: 'auto' }} alt="Garge" />
                    <span className="text-sm font-semibold text-gray-300">Garge</span>
                </div>

                {/* Links */}
                <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                    {[
                        { href: '/contact', label: 'Contact' },
                        { href: '/terms', label: 'Terms of Service' },
                        { href: '/privacy', label: 'Privacy Policy' },
                        { href: '/cookies', label: 'Cookie Policy' },
                    ].map(({ href, label }) => (
                        <Link key={href} href={href} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Bottom */}
                <p className="text-xs text-gray-600">© 2026 Sjølyst Innovations · Org. nr. 934 531 035</p>

            </div>
        </footer>
    );
}