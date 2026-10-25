import { parseKroner } from '@sjolystinnovation/app-kit/payments';
import { z } from 'zod';

/** How many months back garge-api takes sales outside Garge. */
export const OUTSIDE_SALES_MONTHS_BACK = 36;

/** The month of `now` in Norwegian time, as yyyy-MM. */
export function currentMonth(now: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit' }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}`;
}

/** The yyyy-MM month `count` months before `month`. */
export function monthsBefore(month: string, count: number): string {
    const [year, number] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, number - 1 - count, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** A yyyy-MM month that has started and is at most 36 months back, the range garge-api takes. */
export function outsideMonthSchema(now: Date) {
    const latest = currentMonth(now);
    const earliest = monthsBefore(latest, OUTSIDE_SALES_MONTHS_BACK);
    return z
        .string()
        .trim()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Choose a month.')
        // yyyy-MM text sorts in time order.
        .refine(m => m <= latest, 'Choose a month that has started.')
        .refine(m => m >= earliest, `Choose a month at most ${OUTSIDE_SALES_MONTHS_BACK} months back.`);
}

/** An amount in kroner typed into the admin form, turned into whole øre. 0 removes the month. The limit matches garge-api. */
export const outsideAmountSchema = z
    .string()
    .trim()
    .transform((v, ctx) => {
        const ore = parseKroner(v);
        if (ore === null) {
            ctx.addIssue({ code: 'custom', message: 'Enter an amount in kroner, for example 12500 or 12500.50.' });
            return z.NEVER;
        }
        return ore;
    })
    .pipe(z.number().int().min(0).max(1_000_000_000, 'Enter at most 10 000 000 kr.'));
