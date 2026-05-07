import { useEffect } from 'react';

export function useEscapeKey(enabled: boolean, onEscape: () => void) {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onEscape();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [enabled, onEscape]);
}
