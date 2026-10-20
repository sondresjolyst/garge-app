import type { LegalPageViewStrings } from '@sjolystinnovation/app-kit/legal';

/** Writes the dates of the legal pages and their saved versions with the day before the month, such as 17 October 2026. */
export const LEGAL_DATE_LOCALE = 'en-GB';

/** Garge's text around a legal page. The link back keeps the wording the pages had before. */
export const LEGAL_PAGE_STRINGS: Partial<LegalPageViewStrings> = {
    toFrontPage: 'Back to home',
};
