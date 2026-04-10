import React from 'react';

interface AlertProps {
    variant: 'error' | 'success';
    children: React.ReactNode;
    className?: string;
}

const Alert: React.FC<AlertProps> = ({ variant, children, className = '' }) => {
    const styles =
        variant === 'error'
            ? 'text-red-400 bg-red-500/10 border border-red-500/20'
            : 'text-green-400 bg-green-500/10 border border-green-500/20';
    return (
        <p className={`text-sm px-3 py-2 rounded-xl ${styles} ${className}`}>
            {children}
        </p>
    );
};

export default Alert;
