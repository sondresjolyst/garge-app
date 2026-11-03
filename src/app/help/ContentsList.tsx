export interface ContentsLink {
    id: string;
    title: string;
}

export interface ContentsEntry extends ContentsLink {
    groups: { label?: string; items: ContentsLink[] }[];
}

function ContentsAnchor({ link, activeId }: { link: ContentsLink; activeId?: string | null }) {
    const active = link.id === activeId;
    return (
        <a
            href={`#${link.id}`}
            aria-current={active ? 'location' : undefined}
            className={`block rounded-lg px-2 py-1 transition-colors ${active ? 'bg-sky-500/15 font-medium text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}
        >
            {link.title}
        </a>
    );
}

/**
 * The sections of a help page as plain links. `expanded` names the sections that show their
 * subtitles, and leaving it out shows them all. Without JavaScript nothing can expand a section,
 * so a browser that reports no scripting shows them all as well.
 */
export default function ContentsList({ entries, activeId, expanded }: { entries: ContentsEntry[]; activeId?: string | null; expanded?: ReadonlySet<string> }) {
    return (
        <ul className="space-y-0.5 text-sm">
            {entries.map(entry => (
                <li key={entry.id}>
                    <ContentsAnchor link={entry} activeId={activeId} />
                    <div className={!expanded || expanded.has(entry.id) ? undefined : 'hidden [@media(scripting:none)]:block'}>
                        {entry.groups.map((group, index) => (
                            <div key={group.label ?? index}>
                                {group.label && <p className="ml-3 mt-1.5 px-2 text-xs font-medium text-gray-500">{group.label}</p>}
                                <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700/60 pl-1">
                                    {group.items.map(item => (
                                        <li key={item.id}>
                                            <ContentsAnchor link={item} activeId={activeId} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    );
}
