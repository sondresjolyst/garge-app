'use client';

import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { inputClass } from '@/components/TextInput';

export interface InlineEditFieldProps {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    /** Disables inputs/buttons and shows the saving label while a save is in flight. */
    saving?: boolean;
    /** Enables a live "x/max" character counter and caps input length. */
    maxLength?: number;
    /** Validation/error message rendered under the input (default layout only). */
    error?: string | null;
    placeholder?: string;
    inputType?: React.HTMLInputTypeAttribute;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    autoComplete?: string;
    autoFocus?: boolean;
    /**
     * Compact mode: a single inline Save (check) button, no Cancel button, sized
     * to sit inside a header row. Enter saves and Escape cancels via the keyboard.
     * Used by the device drawer's header rename control.
     */
    compact?: boolean;
}

/**
 * Inline text editor: an input with an optional character counter and Save/Cancel
 * controls. The default layout renders Save/Cancel buttons (and an error line);
 * `compact` renders a single inline Save check button for header rename controls.
 */
const InlineEditField: React.FC<InlineEditFieldProps> = ({
    value,
    onChange,
    onSave,
    onCancel,
    saving = false,
    maxLength,
    error,
    placeholder,
    inputType = 'text',
    inputMode,
    autoComplete,
    autoFocus,
    compact = false,
}) => {
    const counter = maxLength != null && (
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${value.length >= maxLength - 5 ? 'text-amber-400' : 'text-gray-600'}`}>
            {value.length}/{maxLength}
        </span>
    );

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                    <input
                        autoFocus={autoFocus}
                        type={inputType}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') onSave();
                            if (e.key === 'Escape') onCancel();
                        }}
                        maxLength={maxLength}
                        className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-2 py-1 pr-10 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                    />
                    {counter}
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    aria-label="Save name"
                    className="p-1 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex-shrink-0"
                >
                    <CheckIcon className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <input
                    type={inputType}
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={inputClass}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    disabled={saving}
                    autoFocus={autoFocus}
                />
                {counter}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
                <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                    <CheckIcon className="h-3.5 w-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={onCancel} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all">
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default InlineEditField;
