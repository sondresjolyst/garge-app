'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import MarkdownText from '@/components/MarkdownText';

interface MarkdownEditorProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    rows?: number;
}

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Description (markdown supported)',
    maxLength = 2000,
    rows = 4,
}: MarkdownEditorProps) {
    const [previewing, setPreviewing] = useState(false);
    const overLimit = maxLength > 0 && value.length > maxLength;

    return (
        <div className="space-y-1.5">
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60 resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-600">
                <span>
                    Supports <span className="text-gray-400">**bold**</span>, <span className="text-gray-400">*italic*</span>, lists, links.
                </span>
                <span className={`tabular-nums ${overLimit ? 'text-red-400' : value.length >= maxLength * 0.9 ? 'text-amber-400' : 'text-gray-600'}`}>
                    {value.length} / {maxLength}
                </span>
            </div>
            <button
                type="button"
                onClick={() => setPreviewing(p => !p)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
                {previewing ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                {previewing ? 'Hide preview' : 'Show preview'}
            </button>
            {previewing && (
                <div className="mt-1 p-3 bg-gray-900/40 border border-dashed border-gray-700/40 rounded-lg">
                    {value.trim() ? (
                        <MarkdownText>{value}</MarkdownText>
                    ) : (
                        <p className="text-xs text-gray-600 italic">Nothing to preview yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
