'use client';

import React from 'react';
import { useEscapeKey } from '@/lib/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface DrawerProps {
    /** Whether the drawer is mounted. When false, nothing is rendered. */
    open: boolean;
    /** Called on backdrop click and Escape (unless `closable` is false). */
    onClose: () => void;
    children: React.ReactNode;
    /** Guards backdrop-click and Escape — e.g. set to false while submitting. Defaults to true. */
    closable?: boolean;
    /** Maps to aria-labelledby on the dialog. */
    labelledBy?: string;
    /** Tailwind classes for the outer fixed container. */
    containerClassName?: string;
    /** Tailwind classes for the backdrop element. */
    backdropClassName?: string;
    /** Tailwind classes for the sliding panel that holds `children`. */
    panelClassName?: string;
}

/**
 * Slide-in panel shell. Handles the fixed backdrop, close-on-backdrop-click,
 * Escape-to-close, dialog ARIA attributes, and body scroll lock while open.
 *
 * Positioning and slide direction are driven by `panelClassName` so each call
 * site keeps its exact look; this component only owns the shared behavior. For
 * drawers with bespoke enter/exit transitions, manage the panel transform
 * classes yourself and keep `open` mounted across the animation.
 */
const Drawer: React.FC<DrawerProps> = ({
    open,
    onClose,
    children,
    closable = true,
    labelledBy,
    containerClassName = 'fixed inset-0 z-50',
    backdropClassName = 'absolute inset-0 bg-black/60 backdrop-blur-sm',
    panelClassName = '',
}) => {
    useEscapeKey(open && closable, onClose);
    useBodyScrollLock(open);

    if (!open) return null;

    const handleBackdrop = () => { if (closable) onClose(); };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={containerClassName}
        >
            <div className={backdropClassName} aria-hidden onClick={handleBackdrop} />
            <div className={panelClassName}>
                {children}
            </div>
        </div>
    );
};

export default Drawer;
