"user client"

import Link from 'next/link';
import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-700 p-4">
            <div className="container ml-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-left sm:mb-0 mb-2">&#169; 2025 Garge. All rights reserved.</p>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                        <Link href="/privacy" className="mb-1 sm:mb-0 sm:mx-2 underline whitespace-nowrap">Privacy Policy</Link>
                        <Link href="/cookies" className="mb-1 sm:mb-0 sm:mx-2 underline whitespace-nowrap">Cookie Policy</Link>
                        <Link href="/terms" className="mb-1 sm:mb-0 sm:mx-2 underline whitespace-nowrap">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
