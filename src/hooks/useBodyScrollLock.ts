'use client';

import { useEffect } from 'react';

/**
 * Prevents the document body from scrolling while a modal or drawer is open.
 * Restores the previous overflow value on close or unmount, and is safe to
 * nest: it only restores once no lock is active.
 */
let lockCount = 0;
let previousOverflow = '';

export function useBodyScrollLock(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;
        if (lockCount === 0) {
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        lockCount++;
        return () => {
            lockCount--;
            if (lockCount === 0) {
                document.body.style.overflow = previousOverflow;
            }
        };
    }, [enabled]);
}
