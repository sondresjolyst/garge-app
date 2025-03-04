"use client"

import React, { useEffect, useState } from 'react';

export default function Content({
    children,
}: {
    children: React.ReactNode
}) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <div className="p-4">
            {children}
        </div>
    );
};
