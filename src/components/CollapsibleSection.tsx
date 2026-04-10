import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface CollapsibleSectionProps {
    label: string;
    count: number;
    children: React.ReactNode;
    className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, count, children, className = '' }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`mt-8 ${className}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors w-full text-left group"
            >
                <ChevronRightIcon
                    className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                />
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-1 text-xs bg-gray-700 text-gray-400 rounded-full px-2 py-0.5 group-hover:bg-gray-600 transition-colors">
                    {count}
                </span>
            </button>
            {open && <div className="mt-4">{children}</div>}
        </div>
    );
};

export default CollapsibleSection;
