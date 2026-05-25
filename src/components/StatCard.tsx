'use client';

import React from 'react';

export interface StatItem {
    label: string;
    value: React.ReactNode;
}

interface StatCardProps extends StatItem {
    /** Renders an em dash when the value is null/undefined. Defaults to true. */
    placeholderWhenEmpty?: boolean;
}

/**
 * Stat tile used across the admin dashboard: a large value over a small label,
 * in the shared `bg-gray-900/50` rounded card.
 */
export const StatCard: React.FC<StatCardProps> = ({ label, value, placeholderWhenEmpty = true }) => {
    const display = placeholderWhenEmpty ? (value ?? '—') : value;
    return (
        <div className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-100 tabular-nums">{display}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
};

interface StatGridProps {
    items: StatItem[];
    /** Tailwind classes for the grid wrapper; defaults to a 2/4-column responsive grid. */
    className?: string;
    placeholderWhenEmpty?: boolean;
}

/** Renders a grid of {@link StatCard}s from an items array. */
export const StatGrid: React.FC<StatGridProps> = ({
    items,
    className = 'grid grid-cols-2 sm:grid-cols-4 gap-3',
    placeholderWhenEmpty = true,
}) => (
    <div className={className}>
        {items.map(item => (
            <StatCard key={item.label} label={item.label} value={item.value} placeholderWhenEmpty={placeholderWhenEmpty} />
        ))}
    </div>
);

export default StatCard;
