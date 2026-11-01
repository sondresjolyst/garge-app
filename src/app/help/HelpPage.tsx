import Image from 'next/image';
import Link from 'next/link';
import { ArrowDownTrayIcon, ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';
import ContentsList, { type ContentsEntry } from './ContentsList';
import DeviceFigure from './DeviceFigure';
import HelpSidebar from './HelpSidebar';
import type { HelpContent, HelpImage, HelpItem, HelpSection } from './helpContent';

/** Shown on hover and keyboard focus. A touch screen has no hover, so it leaves the icon out. */
function AnchorLink({ id, label, group }: { id: string; label: string; group: 'item' | 'section' }) {
    const reveal = group === 'item' ? 'group-hover/item:opacity-100' : 'group-hover/section:opacity-100';
    return (
        <a href={`#${id}`} aria-label={label} className={`pointer-coarse:hidden p-1 rounded-lg text-gray-500 opacity-0 focus:opacity-100 ${reveal} hover:text-sky-400 transition-opacity flex-shrink-0`}>
            <LinkIcon className="h-4 w-4" />
        </a>
    );
}

/** Small beside the text, and the link opens the full image without any script. */
function Figure({ image }: { image: HelpImage }) {
    return (
        <figure>
            <a href={image.src}>
                <Image
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    sizes="(min-width: 1024px) 176px, 224px"
                    className="w-full h-auto rounded-lg border border-gray-700/60"
                />
            </a>
            <figcaption className="mt-1.5 text-xs text-gray-400">{image.caption}</figcaption>
        </figure>
    );
}

function Item({ item, number, linkLabel, grouped }: { item: HelpItem; number?: number; linkLabel: string; grouped: boolean }) {
    const Heading = grouped ? 'h4' : 'h3';
    const hasFigure = Boolean(item.images?.length || item.device);
    return (
        <article id={item.id} className="group/item scroll-mt-20 space-y-3">
            <div className="flex items-start gap-3">
                {number !== undefined && (
                    <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {number}
                    </span>
                )}
                <Heading className="min-w-0 pt-0.5 text-base font-semibold text-gray-100">{item.title}</Heading>
                <AnchorLink id={item.id} label={`${linkLabel}: ${item.title}`} group="item" />
            </div>
            <div className={hasFigure ? 'flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6' : undefined}>
                <div className="min-w-0 flex-1 space-y-2 text-sm text-gray-300 leading-relaxed">{item.body}</div>
                {hasFigure && (
                    <div className="w-full max-w-56 flex-shrink-0 space-y-3 lg:w-44">
                        {item.images?.map(image => <Figure key={image.src} image={image} />)}
                        {item.device && (
                            <figure>
                                <div className="rounded-lg overflow-hidden border border-gray-700/60">
                                    <DeviceFigure label={item.device.label} />
                                </div>
                                <figcaption className="mt-1.5 text-xs text-gray-400">{item.device.caption}</figcaption>
                            </figure>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

function Section({ section, linkLabel }: { section: HelpSection; linkLabel: string }) {
    const List = section.numbered ? 'ol' : 'div';
    const Row = section.numbered ? 'li' : 'div';
    let number = 0;
    return (
        <section id={section.id} className="group/section scroll-mt-20 space-y-6">
            <div className="flex items-start gap-3 border-b border-gray-700/60 pb-2">
                <h2 className="min-w-0 text-xl font-bold text-gray-100">{section.title}</h2>
                <AnchorLink id={section.id} label={`${linkLabel}: ${section.title}`} group="section" />
            </div>
            {section.groups.map((group, index) => (
                <div key={group.id ?? index} className="space-y-6">
                    {group.title && <h3 id={group.id} className="scroll-mt-20 text-sm font-semibold uppercase tracking-wide text-gray-400">{group.title}</h3>}
                    <List className="space-y-8">
                        {group.items.map(item => (
                            <Row key={item.id}>
                                <Item item={item} number={section.numbered ? ++number : undefined} linkLabel={linkLabel} grouped={Boolean(group.title)} />
                            </Row>
                        ))}
                    </List>
                </div>
            ))}
        </section>
    );
}

function PdfDownload({ download }: { download: HelpContent['download'] }) {
    return (
        <a
            href="/garge-manual.pdf"
            download
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all"
        >
            <ArrowDownTrayIcon className="h-4 w-4 flex-shrink-0" />
            {download.label}
        </a>
    );
}

/** The contents of a page: every section, with its subtitles and group labels. */
function contentsEntries(content: HelpContent): ContentsEntry[] {
    return content.sections.map(section => ({
        id: section.id,
        title: section.title,
        groups: section.groups.map(group => ({
            label: group.title,
            items: group.items.map(item => ({ id: item.id, title: item.title })),
        })),
    }));
}

/** A help page in one language. The two route files only choose the content. */
export default function HelpPage({ content }: { content: HelpContent }) {
    const entries = contentsEntries(content);
    return (
        <div lang={content.lang} className="max-w-7xl mx-auto px-4 py-10">
            <div className="lg:grid lg:grid-cols-[13rem_minmax(0,48rem)] xl:grid-cols-[15rem_minmax(0,48rem)] lg:justify-center lg:gap-8">
                <aside className="hidden lg:block lg:-mt-10">
                    <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4">
                        <HelpSidebar label={content.contentsLabel} entries={entries} />
                        <div className="flex-shrink-0 border-t border-gray-700/60 px-2 pt-4">
                            <PdfDownload download={content.download} />
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-3xl font-bold text-gray-100">{content.title}</h1>
                            <Link
                                href={content.switchPath}
                                hrefLang={content.switchLang}
                                lang={content.switchLang}
                                className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-200 border border-gray-700/60 hover:text-white hover:bg-gray-700/60 transition-all flex-shrink-0"
                            >
                                {content.switchLabel}
                            </Link>
                        </div>

                        <details className="group/contents border-y border-gray-700/60 py-3 lg:hidden">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-gray-100 [&::-webkit-details-marker]:hidden">
                                {content.contentsLabel}
                                <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform group-open/contents:rotate-180" />
                            </summary>
                            <nav aria-label={content.contentsLabel} className="mt-3">
                                <ContentsList entries={entries} />
                            </nav>
                        </details>
                    </div>

                    {content.sections.map(section => <Section key={section.id} section={section} linkLabel={content.linkLabel} />)}

                    <div className="border-t border-gray-700/60 pt-6 lg:hidden">
                        <PdfDownload download={content.download} />
                    </div>
                </div>
            </div>
        </div>
    );
}
