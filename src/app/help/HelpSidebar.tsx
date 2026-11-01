'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import ContentsList, { type ContentsEntry } from './ContentsList';

/**
 * The strip of the screen that decides the current section, in pixels from the top. It starts just
 * below where an anchor lands, and is taller than the gap between two problems, so one is always in it.
 */
const STRIP_TOP = 96;
const STRIP_BOTTOM = 136;

/** How long the scrolling after a jump counts as part of the jump, in milliseconds. */
const JUMP_SETTLE_MS = 250;

/** Never changes, so the store never notifies. */
const subscribe = () => () => { };

/** The contents from the lg breakpoint, with the section being read expanded and its current link marked. */
export default function HelpSidebar({ label, entries }: { label: string; entries: ContentsEntry[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    // While a mouse is over the list it holds still, so a link never moves away from the cursor.
    const [mouseHeld, setMouseHeld] = useState<ReadonlySet<string> | null>(null);
    // While the keyboard is in the list every subtitle is open, so Tab reaches all of them.
    const [keyboardInside, setKeyboardInside] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    // False on the server, so the page without JavaScript never claims a state it cannot change.
    const interactive = useSyncExternalStore(subscribe, () => true, () => false);

    const sectionOf = useMemo(() => new Map(entries.flatMap(entry => [
        [entry.id, entry.id] as const,
        ...entry.groups.flatMap(group => group.items.map(item => [item.id, entry.id] as const)),
    ])), [entries]);
    const ids = useMemo(() => [...sectionOf.keys()], [sectionOf]);

    const activeSection = activeId ? sectionOf.get(activeId) : undefined;
    const readingSection = activeSection ?? entries[0].id;
    const expanded = keyboardInside ? new Set(entries.map(entry => entry.id)) : mouseHeld ?? new Set([readingSection]);
    // A subtitle that is folded away cannot show the mark, so its section does.
    const markedId = activeSection && !expanded.has(activeSection) ? activeSection : activeId;

    useEffect(() => {
        let observer: IntersectionObserver;
        let inStrip = new Set<string>();
        let jumpedAt: number | null = null;

        const update = () => {
            if (jumpedAt !== null) return;
            const { scrollHeight } = document.documentElement;
            const atEnd = window.scrollY > 0 && window.scrollY + window.innerHeight >= scrollHeight - 2;
            // A problem sits inside its section, so the last match in page order is the most exact one.
            const current = atEnd ? ids[ids.length - 1] : [...ids].reverse().find(id => inStrip.has(id));
            if (current) setActiveId(current);
            // Back above the first section nothing is being read, so the mark goes. Between sections it stays.
            else if ((document.getElementById(ids[0])?.getBoundingClientRect().top ?? 0) > STRIP_BOTTOM) setActiveId(null);
        };

        const watch = () => {
            observer?.disconnect();
            inStrip = new Set<string>();
            observer = new IntersectionObserver(changes => {
                for (const change of changes) {
                    if (change.isIntersecting) inStrip.add(change.target.id);
                    else inStrip.delete(change.target.id);
                }
                update();
            }, { rootMargin: `-${STRIP_TOP}px 0px -${Math.max(0, window.innerHeight - STRIP_BOTTOM)}px 0px` });

            for (const id of ids) {
                const target = document.getElementById(id);
                if (target) observer.observe(target);
            }
        };

        // A section near the end of the page may never reach the strip, so the target of a jump is marked directly.
        const jumpTo = (id: string) => {
            if (!sectionOf.has(id)) return;
            jumpedAt = Date.now();
            setActiveId(id);
        };
        const jumpToHash = () => jumpTo(window.location.hash.slice(1));
        const onClick = (event: Event) => {
            const href = (event.target as Element).closest?.('a[href^="#"]')?.getAttribute('href');
            if (href) jumpTo(href.slice(1));
        };
        const onScroll = () => {
            if (jumpedAt !== null && Date.now() - jumpedAt < JUMP_SETTLE_MS) return;
            jumpedAt = null;
            update();
        };

        watch();
        jumpToHash();
        window.addEventListener('resize', watch);
        window.addEventListener('hashchange', jumpToHash);
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('click', onClick);
        return () => {
            window.removeEventListener('resize', watch);
            window.removeEventListener('hashchange', jumpToHash);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('click', onClick);
            observer.disconnect();
        };
    }, [ids, sectionOf]);

    // Scrolls only the sidebar, so a short screen still shows the marked link without moving the page.
    useEffect(() => {
        const nav = navRef.current;
        const link = nav?.querySelector('[aria-current]');
        if (!nav || !link || mouseHeld || keyboardInside) return;
        const navBox = nav.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        if (linkBox.top < navBox.top) nav.scrollTop -= navBox.top - linkBox.top;
        else if (linkBox.bottom > navBox.bottom) nav.scrollTop += linkBox.bottom - navBox.bottom;
    }, [markedId, mouseHeld, keyboardInside]);

    // Opening the clicked section only pushes the links below it down, so the clicked link stays put.
    const openClickedSection = (event: MouseEvent<HTMLElement>) => {
        const href = (event.target as Element).closest('a')?.getAttribute('href');
        const section = href ? sectionOf.get(href.slice(1)) : undefined;
        if (section) setMouseHeld(current => current && new Set(current).add(section));
    };

    const holdForMouse = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'mouse') setMouseHeld(expanded);
    };
    const releaseForMouse = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'mouse') setMouseHeld(null);
    };

    // A press or a tap also moves focus. Opening every section then would move the link away before the click lands.
    const onFocus = (event: FocusEvent<HTMLElement>) => {
        if (event.target.matches(':focus-visible')) setKeyboardInside(true);
    };
    const onBlur = (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardInside(false);
    };

    return (
        <nav
            ref={navRef}
            aria-label={label}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto"
            onPointerEnter={holdForMouse}
            onPointerLeave={releaseForMouse}
            onFocusCapture={onFocus}
            onBlurCapture={onBlur}
            onClick={openClickedSection}
        >
            <p className="px-2 text-sm font-semibold text-gray-100">{label}</p>
            <ContentsList entries={entries} activeId={markedId} expanded={expanded} showExpandedState={interactive} />
        </nav>
    );
}
