'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ContentsList, { type ContentsEntry } from './ContentsList';

/**
 * The strip of the screen that decides the current section, in pixels from the top. It starts just
 * below where an anchor lands, and is taller than the gap between two problems, so one is always in it.
 */
const STRIP_TOP = 96;
const STRIP_BOTTOM = 124;

/** The contents from the lg breakpoint, with the section being read marked. */
export default function HelpSidebar({ label, entries }: { label: string; entries: ContentsEntry[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const navRef = useRef<HTMLElement>(null);
    const ids = useMemo(() => entries.flatMap(entry => [entry.id, ...(entry.children ?? []).map(child => child.id)]), [entries]);

    useEffect(() => {
        let observer: IntersectionObserver;

        const watch = () => {
            observer?.disconnect();
            const inStrip = new Set<string>();
            observer = new IntersectionObserver(changes => {
                for (const change of changes) {
                    if (change.isIntersecting) inStrip.add(change.target.id);
                    else inStrip.delete(change.target.id);
                }
                // A problem sits inside its section, so the last match in page order is the most exact one.
                const current = [...ids].reverse().find(id => inStrip.has(id));
                if (current) setActiveId(current);
                // Back above the first section nothing is being read, so the mark goes. Between sections it stays.
                else if ((document.getElementById(ids[0])?.getBoundingClientRect().top ?? 0) > STRIP_BOTTOM) setActiveId(null);
            }, { rootMargin: `-${STRIP_TOP}px 0px -${Math.max(0, window.innerHeight - STRIP_BOTTOM)}px 0px` });

            for (const id of ids) {
                const target = document.getElementById(id);
                if (target) observer.observe(target);
            }
        };

        watch();
        window.addEventListener('resize', watch);
        return () => {
            window.removeEventListener('resize', watch);
            observer.disconnect();
        };
    }, [ids]);

    // Scrolls only the sidebar, so a short screen still shows the active link without moving the page.
    useEffect(() => {
        const nav = navRef.current;
        const link = nav?.querySelector('[aria-current]');
        if (!nav || !link) return;
        const navBox = nav.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        if (linkBox.top < navBox.top) nav.scrollTop -= navBox.top - linkBox.top;
        else if (linkBox.bottom > navBox.bottom) nav.scrollTop += linkBox.bottom - navBox.bottom;
    }, [activeId]);

    return (
        <nav
            ref={navRef}
            aria-label={label}
            className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto space-y-2"
        >
            <h2 className="px-2 text-sm font-semibold text-gray-100">{label}</h2>
            <ContentsList entries={entries} activeId={activeId} />
        </nav>
    );
}
