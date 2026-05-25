'use client';

import { RefObject, useEffect } from 'react';

/**
 * Dismisses something when a pointer interaction lands outside the referenced element.
 * Listens for both mousedown and touchstart so it works on touch devices too.
 *
 * @param ref      Element to treat as "inside". Clicks within it are ignored.
 * @param onOutside Called when a click/tap occurs outside the element.
 * @param enabled  When false, no listeners are attached (defaults to true).
 */
export function useOutsideClick<T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutside: () => void,
    enabled: boolean = true,
) {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [ref, onOutside, enabled]);
}
