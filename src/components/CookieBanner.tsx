"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_VERSION = 'v1';
const STORAGE_KEY = 'cookie-consent';

type ConsentRecord = { version: string; timestamp: number };

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`);
                if (res.ok) {
                    const settings = await res.json();
                    if (!settings.cookieBannerEnabled) return;
                }
            } catch {
                // backend unreachable — fall through to consent check
            }

            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const record: ConsentRecord | null = raw ? JSON.parse(raw) : null;
                if (!record || record.version !== CONSENT_VERSION) {
                    setVisible(true);
                }
            } catch {
                setVisible(true);
            }
        }
        init();
    }, []);

    function dismiss() {
        const record: ConsentRecord = { version: CONSENT_VERSION, timestamp: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-lg w-full bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-start gap-4">
                <p className="flex-1 text-sm text-gray-400">
                    This site uses cookies.{' '}
                    <Link href="/cookies" className="text-sky-400 hover:text-sky-300 transition-colors">
                        Learn more
                    </Link>
                </p>
                <button
                    onClick={dismiss}
                    className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
