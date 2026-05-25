import { z } from 'zod';
import type { FieldErrors } from '@/lib/errors';

/**
 * Validation rules for the registration form. Shared between the user service
 * (server-bound submit) and the register page (live client-side feedback) so
 * the password rules stay in one place.
 */
export const registerSchema = z.object({
    firstName: z
        .string()
        .min(2, { message: 'First Name must be at least 2 characters long.' })
        .trim(),
    lastName: z
        .string()
        .min(2, { message: 'Last Name must be at least 2 characters long.' })
        .trim(),
    userName: z
        .string()
        .min(2, { message: 'Username must be at least 2 characters long.' })
        .trim(),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    password: z
        .string()
        .min(8, { message: 'Be at least 8 characters long.' })
        .max(128, { message: 'Be at most 128 characters long.' })
        .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Contain at least one number.' })
        .regex(/[A-Z]/, { message: 'Contain at least one uppercase letter.' })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Contain at least one special character.',
        })
        .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Groups Zod issues into per-field message arrays keyed by the first path segment. */
export function zodIssuesToFieldErrors(issues: z.ZodIssue[]): FieldErrors {
    return issues.reduce((acc, issue) => {
        const path = issue.path[0] as string;
        if (!acc[path]) acc[path] = [];
        acc[path].push(issue.message);
        return acc;
    }, {} as FieldErrors);
}
