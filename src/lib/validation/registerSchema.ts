import { z } from 'zod';
import { passwordSchema } from '@sjolystinnovation/app-kit/validation';
import type { FieldErrors } from '@/lib/errors';

/** The new-password rule the API enforces, in garge's wording. garge-api also caps the length at 128. */
export const gargePasswordSchema = passwordSchema({
    tooShort: 'Be at least 8 characters long.',
    lowercase: 'Contain at least one lowercase letter (a-z).',
    uppercase: 'Contain at least one uppercase letter (A-Z).',
    digit: 'Contain at least one number (0-9).',
}).max(128, 'Be at most 128 characters long.');

/**
 * Validation rules for the registration form. Shared between the user service
 * (server-bound submit) and the register page (live client-side feedback) so
 * the password rules stay in one place.
 */
// The limits match garge-api's RegisterUserDto. The username characters are Identity's defaults.
export const registerSchema = z.object({
    firstName: z
        .string()
        .min(1, { message: 'First Name is required.' })
        .max(50, { message: 'First Name must be at most 50 characters long.' })
        .trim(),
    lastName: z
        .string()
        .min(1, { message: 'Last Name is required.' })
        .max(50, { message: 'Last Name must be at most 50 characters long.' })
        .trim(),
    userName: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(64, { message: 'Username must be at most 64 characters long.' })
        .regex(/^[A-Za-z0-9._@+-]*$/, { message: 'Username can only use letters A-Z, digits and - . _ @ +.' })
        .trim(),
    email: z
        .string()
        .email({ message: 'Please enter a valid email.' })
        .max(254, { message: 'Email must be at most 254 characters long.' })
        .trim(),
    password: gargePasswordSchema,
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
