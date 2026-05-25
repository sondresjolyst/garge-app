'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { inputClass } from '@/components/TextInput';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Password input with a show/hide eye toggle. Mirrors the styling used across the
 * auth pages: the shared `inputClass` plus `pr-10` to leave room for the toggle.
 * Any extra className is appended after that base.
 */
const PasswordInput: React.FC<Props> = ({ className, ...props }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <input
                {...props}
                type={show ? 'text' : 'password'}
                className={`${inputClass} pr-10${className ? ` ${className}` : ''}`}
            />
            <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
            >
                {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
        </div>
    );
};

export default PasswordInput;
