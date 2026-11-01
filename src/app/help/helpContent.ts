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
    /** Ids this item used to have, so links already sent to customers keep working. */
    aliases?: string[];
    body: ReactNode;
    images?: HelpImage[];
    /** Shows the picture of the buttons on the case beside the text. */
    device?: { label: string; caption: ReactNode };
}

export interface HelpGroup {
    id?: string;
    /** The label above a part of a section. A section with one part leaves it out. */
    title?: string;
    items: HelpItem[];
}

export interface HelpSection {
    id: string;
    title: string;
    /** Ids this section used to have, so links already sent to customers keep working. */
    aliases?: string[];
    /** Numbers the items, for the setup steps. */
    numbered?: boolean;
    groups: HelpGroup[];
}

export interface HelpContent {
    /** The BCP 47 tag of the text. */
    lang: 'nb' | 'en';
    path: string;
    switchLabel: string;
    switchPath: string;
    switchLang: 'nb' | 'en';
    title: string;
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
