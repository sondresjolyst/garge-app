import { defineSite } from '@sjolystinnovation/app-kit/seo';
import { COMPANY } from '@/lib/company';

/** The URL and robots helpers for this site. */
export const site = defineSite({ name: COMPANY.name, url: 'https://www.garge.no', titleSeparator: ' | ' });
