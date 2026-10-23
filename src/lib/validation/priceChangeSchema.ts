import { parseKroner } from '@sjolystinnovation/app-kit/payments';
import { z } from 'zod';

/** The least notice a price increase gets, as garge-api enforces it. */
export const MIN_NOTICE_DAYS = 30;

/** The largest amount a Vipps agreement allows, 20 000 kr. */
const MAX_AGREEMENT_IN_ORE = 2_000_000;

/** The earliest effective date, as `yyyy-MM-dd` in UTC, for an increase scheduled at `now`. */
export function earliestEffectiveFrom(now: Date = new Date()): string {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + MIN_NOTICE_DAYS));
    return d.toISOString().slice(0, 10);
}

/**
 * A price increase typed into the admin form: the new price in kroner, turned into whole øre, and
 * the effective date. The rules match garge-api, which checks them again.
 */
export function priceChangeSchema(currentPriceInOre: number, now: Date = new Date()) {
    const earliest = earliestEffectiveFrom(now);
    return z.object({
        newPrice: z
            .string()
            .trim()
            .transform((v, ctx) => {
                const ore = parseKroner(v);
                if (ore === null) {
                    ctx.addIssue({ code: 'custom', message: 'Enter a price in kroner, for example 59 or 59.50.' });
                    return z.NEVER;
                }
                return ore;
            })
            .pipe(z
                .number()
                .int()
                .refine(v => v > currentPriceInOre, 'The new price must be higher than the current one. Lower a price by editing the plan.')
                .refine(v => v <= MAX_AGREEMENT_IN_ORE, 'Enter at most 20 000 kr.')),
        effectiveFrom: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.')
            .refine(v => v >= earliest, `Pick ${earliest} or later, ${MIN_NOTICE_DAYS} days from today.`),
    });
}
