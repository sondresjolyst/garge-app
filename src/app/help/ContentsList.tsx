export interface ContentsEntry {
    id: string;
    title: string;
    children?: ContentsEntry[];
}

function ContentsLink({ entry, activeId }: { entry: ContentsEntry; activeId?: string | null }) {
    const active = entry.id === activeId;
    return (
        <a
            href={`#${entry.id}`}
            aria-current={active ? 'location' : undefined}
            className={`block rounded-lg px-2 py-1 transition-colors ${active ? 'bg-sky-500/15 font-medium text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}
        >
            {entry.title}
        </a>
    );
}

/** The sections of a help page as plain links, so they work without JavaScript. */
export default function ContentsList({ entries, activeId }: { entries: ContentsEntry[]; activeId?: string | null }) {
    return (
        <ul className="space-y-0.5 text-sm">
            {entries.map(entry => (
                <li key={entry.id}>
                    <ContentsLink entry={entry} activeId={activeId} />
                    {entry.children && (
                        <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700/60 pl-1">
                            {entry.children.map(child => (
                                <li key={child.id}>
                                    <ContentsLink entry={child} activeId={activeId} />
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}
