import { z } from 'zod';

const required = (max: number) => z.string().trim().min(1, 'Required.').max(max, `At most ${max} characters.`);
const optional = (max: number) => z.string().trim().max(max, `At most ${max} characters.`);
const email = z.string().trim().min(1, 'Required.').max(200, 'At most 200 characters.').pipe(z.email('Not a valid email address.'));

/**
 * The company details form on the admin page. The limits match SjolystInnovation.AppKit.SiteSettings,
 * which also checks the organisation number's check digit and that VAT registration has one.
 */
export const companySettingsSchema = z
    .object({
        contactRecipientEmail: email,
        companyName: required(100),
        companyLegalName: optional(200),
        orgNumber: z.string().trim().regex(/^$|^[\d ]+$/, 'Not a valid organisation number. It has nine digits and ends in a check digit.'),
        streetAddress: required(200),
        postalCode: z.string().trim().regex(/^$|^\d{4}$/, 'A Norwegian postal code is four digits.'),
        addressLocality: optional(100),
        addressRegion: optional(100),
        publicEmail: email,
        publicPhone: optional(40),
    })
    .refine(s => s.postalCode === '' || s.addressLocality !== '', {
        path: ['addressLocality'],
        message: 'A postal code needs the place name that goes with it.',
    });

export type CompanySettingsForm = z.input<typeof companySettingsSchema>;
