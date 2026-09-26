"use client"

import { useState, useEffect, useSyncExternalStore } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type State = 'hidden' | 'android' | 'ios';
type Platform = 'ineligible' | 'ios' | 'other';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
}

/** Fixed for the lifetime of the page, so the store never notifies. */
const subscribe = () => () => { };

/**
 * Reads the browser once. Returning it through useSyncExternalStore keeps the
 * browser access out of render and out of an effect, and yields 'ineligible'
 * on the server so the first client render matches the server markup.
 */
function detectPlatform(): Platform {
    if (localStorage.getItem('install-dismissed')) return 'ineligible';
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) return 'ineligible';
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    return isIos ? 'ios' : 'other';
}

const serverPlatform = (): Platform => 'ineligible';

export default function InstallPrompt() {
    const platform = useSyncExternalStore(subscribe, detectPlatform, serverPlatform);
    const [dismissed, setDismissed] = useState(false);
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

    // Registered on mount rather than once `platform` resolves: the platform read
    // only arrives on the second commit, and the browser can fire
    // beforeinstallprompt before that. Eligibility is applied when deriving
    // `state`, so an ineligible client still shows nothing.
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const state: State =
        dismissed || platform === 'ineligible' ? 'hidden'
            : platform === 'ios' ? 'ios'
                : deferred ? 'android'
                    : 'hidden';

    function dismiss() {
        localStorage.setItem('install-dismissed', '1');
        setDismissed(true);
    }

    async function install() {
        if (!deferred) return;
        await deferred.prompt();
        // Clearing the event (rather than dismissing) leaves the banner able to
        // come back if the browser fires beforeinstallprompt again.
        setDeferred(null);
    }

    if (state === 'hidden') return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-39 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-lg w-full bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <div className="flex items-start gap-3">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-100">Install Garge</p>
                        {state === 'android' ? (
                            <p className="text-xs text-gray-400 mt-0.5">Add to your home screen for the best experience and push notifications.</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-0.5">
                                Tap <span className="text-gray-200">Share</span> → <span className="text-gray-200">Add to Home Screen</span> to install and enable push notifications.
                            </p>
                        )}
                    </div>
                    <button onClick={dismiss} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 mt-0.5">
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
                {state === 'android' && (
                    <div className="flex gap-2 mt-3">
                        <button onClick={install} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors">
                            Install
                        </button>
                        <button onClick={dismiss} className="px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs transition-colors">
                            Not now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
