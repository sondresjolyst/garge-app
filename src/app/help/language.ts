export const HELP_PATHS = { no: '/no/help', en: '/en/help' } as const;

const NORWEGIAN_TAGS = new Set(['nb', 'nn', 'no']);

/** The best quality the header gives a language, and where it first asked for it. */
interface Preference {
    quality: number;
    position: number;
}

/** Reads a quality value. Anything RFC 9110 does not allow gives null, so that entry is ignored. */
function parseQuality(parameters: string[]): number | null {
    const parameter = parameters.map(p => p.trim().toLowerCase()).find(p => p.startsWith('q='));
    if (parameter === undefined) return 1;
    const value = parameter.slice(2);
    if (!/^(0(\.\d{0,3})?|1(\.0{0,3})?)$/.test(value)) return null;
    return Number(value);
}

function better(current: Preference | null, quality: number, position: number): Preference | null {
    if (quality === 0) return current;
    return current === null || quality > current.quality ? { quality, position } : current;
}

function prefersNorwegian(norwegian: Preference | null, english: Preference | null): boolean {
    if (norwegian === null) return false;
    if (english === null || norwegian.quality > english.quality) return true;
    return norwegian.quality === english.quality && norwegian.position < english.position;
}

/**
 * The help page for an Accept-Language header. Norwegian goes to the Norwegian page when the header
 * ranks it above English, and every other header goes to the English page.
 */
export function helpPathFor(acceptLanguage: string | null): string {
    let norwegian: Preference | null = null;
    let english: Preference | null = null;

    (acceptLanguage ?? '').split(',').forEach((entry, position) => {
        const [range, ...parameters] = entry.split(';');
        const primary = range.trim().toLowerCase().split('-')[0];
        const quality = parseQuality(parameters);
        if (quality === null) return;
        if (NORWEGIAN_TAGS.has(primary)) norwegian = better(norwegian, quality, position);
        if (primary === 'en' || primary === '*') english = better(english, quality, position);
    });

    return prefersNorwegian(norwegian, english) ? HELP_PATHS.no : HELP_PATHS.en;
}

/** Whether a path is one of the help pages. */
export function isHelpPath(pathname: string | null): boolean {
    return pathname === HELP_PATHS.no || pathname === HELP_PATHS.en;
}
