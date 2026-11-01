import Image from 'next/image';
import Link from 'next/link';
import { ArrowDownTrayIcon, LinkIcon } from '@heroicons/react/24/outline';
import DeviceFigure from './DeviceFigure';
import type { HelpContent, HelpImage, HelpItem, HelpSection } from './helpContent';

const CARD = 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-lg';

function AnchorLink({ id, label }: { id: string; label: string }) {
    return (
        <a href={`#${id}`} aria-label={label} className="p-1 rounded-lg text-gray-500 hover:text-sky-400 transition-colors flex-shrink-0">
            <LinkIcon className="h-4 w-4" />
        </a>
    );
}

function Figure({ image }: { image: HelpImage }) {
    return (
        <figure className="max-w-sm">
            <Image
                src={image.src}
                width={image.width}
                height={image.height}
                alt={image.alt}
                sizes="(max-width: 640px) 100vw, 384px"
                className="w-full h-auto rounded-xl border border-gray-700/60"
            />
            <figcaption className="mt-2 text-xs text-gray-400">{image.caption}</figcaption>
        </figure>
    );
}

function Item({ item, number, linkLabel }: { item: HelpItem; number?: number; linkLabel: string }) {
    return (
        <article id={item.id} className="scroll-mt-20 space-y-3">
            <div className="flex items-start gap-3">
                {number !== undefined && (
                    <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {number}
                    </span>
                )}
                <h3 className="flex-1 min-w-0 pt-0.5 text-base font-semibold text-gray-100">{item.title}</h3>
                <AnchorLink id={item.id} label={`${linkLabel}: ${item.title}`} />
            </div>
            <div className="space-y-2 text-sm text-gray-400 leading-relaxed">{item.body}</div>
            {item.images && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.images.map(image => <Figure key={image.src} image={image} />)}
                </div>
            )}
        </article>
    );
}

function Section({ section, linkLabel }: { section: HelpSection; linkLabel: string }) {
    return (
        <section id={section.id} className={`${CARD} scroll-mt-20 space-y-6`}>
            <div className="flex items-start gap-3">
                <h2 className="flex-1 min-w-0 text-xl font-bold text-gray-100">{section.title}</h2>
                <AnchorLink id={section.id} label={`${linkLabel}: ${section.title}`} />
            </div>
            {section.intro && <p className="text-sm text-gray-400 leading-relaxed">{section.intro}</p>}
            {section.device && (
                <figure className="max-w-sm">
                    <div className="rounded-xl overflow-hidden border border-gray-700/60">
                        <DeviceFigure label={section.device.label} />
                    </div>
                    <figcaption className="mt-2 text-xs text-gray-400">{section.device.caption}</figcaption>
                </figure>
            )}
            {section.items.map((item, index) => (
                <Item key={item.id} item={item} number={section.numbered ? index + 1 : undefined} linkLabel={linkLabel} />
            ))}
        </section>
    );
}

/** A help page in one language. The two route files only choose the content. */
export default function HelpPage({ content }: { content: HelpContent }) {
    return (
        <div lang={content.lang} className="max-w-7xl mx-auto px-4 py-10">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-bold text-gray-100">{content.title}</h1>
                    <Link
                        href={content.switchPath}
                        hrefLang={content.switchLang}
                        lang={content.switchLang}
                        className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-200 bg-gray-800/60 border border-gray-700/40 hover:text-white hover:bg-gray-700/60 transition-all flex-shrink-0"
                    >
                        {content.switchLabel}
                    </Link>
                </div>

                <div className={`${CARD} space-y-4`}>
                    <p className="text-sm text-gray-400 leading-relaxed">{content.intro}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <a
                            href="/garge-manual.pdf"
                            download
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all flex-shrink-0"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            {content.download.label}
                        </a>
                        <p className="text-xs text-gray-400 leading-relaxed">{content.download.note}</p>
                    </div>
                </div>

                <nav aria-label={content.contentsLabel} className={`${CARD} space-y-3`}>
                    <h2 className="text-sm font-semibold text-gray-100">{content.contentsLabel}</h2>
                    <ul className="space-y-2 text-sm">
                        {content.sections.map(section => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="text-sky-400 hover:text-sky-300 transition-colors">{section.title}</a>
                                {section.id === 'troubleshooting' && (
                                    <ul className="mt-2 ml-4 space-y-1.5">
                                        {section.items.map(item => (
                                            <li key={item.id}>
                                                <a href={`#${item.id}`} className="text-gray-400 hover:text-sky-300 transition-colors">{item.title}</a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {content.sections.map(section => <Section key={section.id} section={section} linkLabel={content.linkLabel} />)}
            </div>
        </div>
    );
}
