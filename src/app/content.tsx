"use client"

import React, { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { isHelpPath } from './help/language';

/** Never changes, so the store never notifies. */
const subscribe = () => () => { };

export default function Content({
    children,
}: {
    children: React.ReactNode
}) {
    // False on the server and during hydration, true on the client afterwards.
    const isClient = useSyncExternalStore(subscribe, () => true, () => false);

    // The help pages are in the server HTML, so their links and anchors work before and without JavaScript.
    const pathname = usePathname();

    if (!isClient && !isHelpPath(pathname)) {
        return null;
    }

    return (
        <div className="p-4">
            {children}
        </div>
    );
};
