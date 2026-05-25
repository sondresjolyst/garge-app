'use client';

import React from 'react';
import { useEscapeKey } from '@/lib/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface ModalProps {
    /** Whether the modal is rendered. When false, nothing is mounted. */
    open: boolean;
    /** Called on backdrop click and Escape (unless `closable` is false). */
    onClose: () => void;
    children: React.ReactNode;
    /** Guards backdrop-click and Escape — e.g. set to false while submitting. Defaults to true. */
    closable?: boolean;
    /** Dialog role. Defaults to "dialog"; ConfirmModal uses "alertdialog". */
    role?: 'dialog' | 'alertdialog';
    /** Maps to aria-labelledby on the dialog. */
    labelledBy?: string;
    /** Tailwind classes for the outer fixed positioning/backdrop container. */
    containerClassName?: string;
    /** Tailwind classes for the panel that holds `children`. */
    panelClassName?: string;
    /**
     * When true, a separate absolute backdrop element is rendered behind the panel
     * (used by call sites that blur the backdrop independently of the container).
     * When false, the container itself carries the backdrop styling.
     */
    withBackdropElement?: boolean;
    /** Extra classes for the standalone backdrop element (only when withBackdropElement). */
    backdropClassName?: string;
}

/**
 * Centered dialog shell. Handles the fixed backdrop, close-on-backdrop-click,
 * Escape-to-close, dialog ARIA attributes, and body scroll lock while open.
 *
 * Layout is intentionally driven by `containerClassName`/`panelClassName` so each
 * call site keeps its exact look; this component only owns the shared behavior.
 */
const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    children,
    closable = true,
    role = 'dialog',
    labelledBy,
    containerClassName = '',
    panelClassName = '',
    withBackdropElement = false,
    backdropClassName = '',
}) => {
    useEscapeKey(open && closable, onClose);
    useBodyScrollLock(open);

    if (!open) return null;

    const handleBackdrop = () => { if (closable) onClose(); };

    return (
        <div
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={containerClassName}
        >
            {withBackdropElement ? (
                <div className={backdropClassName} aria-hidden onClick={handleBackdrop} />
            ) : (
                <div className="absolute inset-0" aria-hidden onClick={handleBackdrop} />
            )}
            <div className={panelClassName}>
                {children}
            </div>
        </div>
    );
};

export default Modal;
