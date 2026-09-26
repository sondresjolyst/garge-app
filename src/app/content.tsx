"use client"

import React, { useSyncExternalStore } from 'react';

/** Never changes, so the store never notifies. */
const subscribe = () => () => { };

export default function Content({
    children,
}: {
    children: React.ReactNode
}) {
    // False on the server and during hydration, true on the client afterwards.
    const isClient = useSyncExternalStore(subscribe, () => true, () => false);

    if (!isClient) {
        return null;
    }

    return (
        <div className="p-4">
            {children}
        </div>
    );
};
