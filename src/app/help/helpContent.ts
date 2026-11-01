import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { site } from '@/lib/seo/site';
import { HELP_PATHS } from './language';

export interface HelpImage {
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: ReactNode;
}

export interface HelpItem {
    /** The same in both languages, in English, so a customer can be sent straight to it. */
    id: string;
    title: string;
    body: ReactNode;
    images?: HelpImage[];
}

export interface HelpSection {
    id: string;
    title: string;
    intro?: ReactNode;
    /** Numbers the items, for the setup steps. */
    numbered?: boolean;
    /** Shows the picture of the buttons on the case below the intro. */
    device?: { label: string; caption: ReactNode };
    items: HelpItem[];
}

export interface HelpContent {
    /** The BCP 47 tag of the text. */
    lang: 'nb' | 'en';
    path: string;
    switchLabel: string;
    switchPath: string;
    switchLang: 'nb' | 'en';
    title: string;
    intro: string;
    metaTitle: string;
    metaDescription: string;
    download: { label: string; note: string };
    contentsLabel: string;
    /** The accessible name of a section's link, ahead of its title. */
    linkLabel: string;
    sections: HelpSection[];
}

/** The title, description, canonical and language alternates of a help page. */
export function helpMetadata(content: HelpContent): Metadata {
    return {
        title: content.metaTitle,
        description: content.metaDescription,
        alternates: {
            canonical: site.absoluteUrl(content.path),
            languages: {
                nb: site.absoluteUrl(HELP_PATHS.no),
                en: site.absoluteUrl(HELP_PATHS.en),
                'x-default': site.absoluteUrl('/help'),
            },
        },
    };
}

/** Every id a help page can be linked to. */
export function helpIds(content: HelpContent): string[] {
    return content.sections.flatMap(section => [section.id, ...section.items.map(item => item.id)]);
}

/** Every image a help page shows, as public paths. */
export function helpImages(content: HelpContent): string[] {
    return content.sections.flatMap(section => section.items.flatMap(item => (item.images ?? []).map(image => image.src)));
}
