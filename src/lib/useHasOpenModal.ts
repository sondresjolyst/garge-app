'use client';

import { useEffect, useState } from 'react';

const MODAL_SELECTOR = '[aria-modal="true"]';

export function useHasOpenModal(): boolean {
    const [hasModal, setHasModal] = useState(false);

    useEffect(() => {
        const check = () => {
            setHasModal(document.querySelector(MODAL_SELECTOR) !== null);
        };
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-modal'],
        });
        return () => observer.disconnect();
    }, []);

    return hasModal;
}
