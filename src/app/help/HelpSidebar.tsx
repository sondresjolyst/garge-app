'use client';

import { useEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import ContentsList, { type ContentsEntry } from './ContentsList';

/** The current section is the last one whose top has passed this line, in pixels from the top. An anchor lands just above it. */
const READING_LINE = 100;

/** How long a scroll can still be the browser's own jump to an anchor, in milliseconds. */
const JUMP_SETTLE_MS = 250;

interface Jump {
    at: number;
    sawOwnScroll: boolean;
}

/** The contents from the lg breakpoint, with the section being read expanded and its current link marked. */
export default function HelpSidebar({ label, entries }: { label: string; entries: ContentsEntry[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    // While a mouse is over the list it holds still, so a link never moves away from the cursor.
    const [mouseHeld, setMouseHeld] = useState<ReadonlySet<string> | null>(null);
    // While the keyboard is in the list every subtitle is open, so Tab reaches all of them.
    const [keyboardInside, setKeyboardInside] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const jump = useRef<Jump | null>(null);

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
        const markFromScroll = () => {
            const { scrollHeight } = document.documentElement;
            const atEnd = window.scrollY > 0 && window.scrollY + window.innerHeight >= scrollHeight - 2;
            const passed = ids.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= READING_LINE);
            setActiveId(atEnd ? ids[ids.length - 1] : passed[passed.length - 1] ?? null);
        };

        // A section near the end of the page may never reach the line, so the target of a jump is marked directly.
        const markFromHash = () => {
            const id = window.location.hash.slice(1);
            if (!ids.includes(id)) return;
            jump.current = { at: Date.now(), sawOwnScroll: false };
            setActiveId(id);
        };

        // The first scroll right after a jump is the jump itself. Any other means the reader has moved on.
        const onScroll = () => {
            const current = jump.current;
            if (current && !current.sawOwnScroll && Date.now() - current.at < JUMP_SETTLE_MS) {
                current.sawOwnScroll = true;
                return;
            }
            markFromScroll();
        };

        markFromScroll();
        markFromHash();
        window.addEventListener('hashchange', markFromHash);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('hashchange', markFromHash);
            window.removeEventListener('scroll', onScroll);
        };
    }, [ids]);

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

    const onClick = (event: MouseEvent<HTMLElement>) => {
        // Ctrl, Cmd and Shift open the link elsewhere, so this page is not going anywhere.
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        const id = (event.target as Element).closest('a')?.getAttribute('href')?.slice(1);
        const section = id ? sectionOf.get(id) : undefined;
        if (!id || !section) return;
        // A click on the current address fires no hashchange, so the click marks it here.
        jump.current = { at: Date.now(), sawOwnScroll: false };
        setActiveId(id);
        // Opening the clicked section only pushes the links below it down, so the clicked link stays put.
        setMouseHeld(current => current && new Set(current).add(section));
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

    // With every section open the list is tall. Sticky would push it off the top at the end of the page,
    // so it stays short enough for the space above the footer and scrolls inside itself.
    return (
        <nav
            ref={navRef}
            aria-label={label}
            className={`min-h-0 flex-1 space-y-2 overflow-y-auto ${keyboardInside ? 'max-h-[calc(100vh-31rem)] min-h-24' : ''}`}
            onPointerEnter={holdForMouse}
            onPointerLeave={releaseForMouse}
            onFocusCapture={onFocus}
            onBlurCapture={onBlur}
            onClick={onClick}
        >
            <p className="px-2 text-sm font-semibold text-gray-100">{label}</p>
            <ContentsList entries={entries} activeId={markedId} expanded={expanded} />
        </nav>
    );
}
