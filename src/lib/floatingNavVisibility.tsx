'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

interface FloatingNavVisibility {
    hidden: boolean;
    setHidden: (hidden: boolean) => void;
}

const FloatingNavVisibilityContext = createContext<FloatingNavVisibility | null>(null);

export function FloatingNavVisibilityProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
    return (
        <FloatingNavVisibilityContext.Provider value={value}>
            {children}
        </FloatingNavVisibilityContext.Provider>
    );
}

export function useFloatingNavVisibility(): FloatingNavVisibility {
    const ctx = useContext(FloatingNavVisibilityContext);
    if (!ctx) {
        throw new Error('useFloatingNavVisibility must be used within FloatingNavVisibilityProvider');
    }
    return ctx;
}
