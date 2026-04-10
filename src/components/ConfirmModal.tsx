'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
    title: string;
    subtitle?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    subtitle = 'This cannot be undone',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-gray-800 border border-gray-700/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                    </div>
                </div>
                <p className="text-sm text-gray-300 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
