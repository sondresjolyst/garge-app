'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import ContentsList, { type ContentsEntry } from './ContentsList';

/**
 * The strip of the screen that decides the current section, in pixels from the top. It starts just
 * below where an anchor lands, and is taller than the gap between two problems, so one is always in it.
 */
const STRIP_TOP = 96;
const STRIP_BOTTOM = 136;

/** The contents from the lg breakpoint, with the section being read expanded and its current link marked. */
export default function HelpSidebar({ label, entries }: { label: string; entries: ContentsEntry[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    // While the mouse is over the list it holds still, so a link never moves away from the cursor.
    const [held, setHeld] = useState<ReadonlySet<string> | null>(null);
    const navRef = useRef<HTMLElement>(null);

    const sectionOf = useMemo(() => new Map(entries.flatMap(entry => [
        [entry.id, entry.id] as const,
        ...entry.groups.flatMap(group => group.items.map(item => [item.id, entry.id] as const)),
    ])), [entries]);
    const ids = useMemo(() => [...sectionOf.keys()], [sectionOf]);

    const activeSection = activeId ? sectionOf.get(activeId) : undefined;
    const readingSection = activeSection ?? entries[0].id;
    const expanded = held ?? new Set([readingSection]);
    // A subtitle that is folded away cannot show the mark, so its section does.
    const markedId = activeSection && !expanded.has(activeSection) ? activeSection : activeId;

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

    // Scrolls only the sidebar, so a short screen still shows the marked link without moving the page.
    useEffect(() => {
        const nav = navRef.current;
        const link = nav?.querySelector('[aria-current]');
        if (!nav || !link || held) return;
        const navBox = nav.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        if (linkBox.top < navBox.top) nav.scrollTop -= navBox.top - linkBox.top;
        else if (linkBox.bottom > navBox.bottom) nav.scrollTop += linkBox.bottom - navBox.bottom;
    }, [markedId, held]);

    // Opening the clicked section only pushes the links below it down, so the clicked link stays put.
    const openClickedSection = (event: MouseEvent<HTMLElement>) => {
        const href = (event.target as Element).closest('a')?.getAttribute('href');
        const section = href ? sectionOf.get(href.slice(1)) : undefined;
        if (section) setHeld(current => current && new Set(current).add(section));
    };

    return (
        <nav
            ref={navRef}
            aria-label={label}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto"
            onMouseEnter={() => setHeld(expanded)}
            onMouseLeave={() => setHeld(null)}
            onClick={openClickedSection}
        >
            <h2 className="px-2 text-sm font-semibold text-gray-100">{label}</h2>
            <ContentsList entries={entries} activeId={markedId} expanded={expanded} />
        </nav>
    );
}
