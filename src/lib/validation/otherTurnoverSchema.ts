import { z } from 'zod';

/** An amount in kroner typed into the admin form, turned into whole øre. The limit matches garge-api. */
export const otherTurnoverSchema = z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/, 'Enter an amount in kroner, for example 12500 or 12500.50.')
    .transform(v => Math.round(Number(v.replace(',', '.')) * 100))
    .pipe(z.number().int().min(0).max(10_000_000_000, 'Enter at most 100 000 000 kr.'));
