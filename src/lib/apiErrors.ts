import { AxiosError } from 'axios';

export function parseErrorCode(err: unknown): string | null {
    if (!(err instanceof AxiosError)) return null;
    const data = err.response?.data;
    if (!data || typeof data !== 'object') return null;
    const code = (data as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
}

export function parseValidationErrors(data: unknown): Record<string, string[]> | null {
    if (!data || typeof data !== 'object') return null;
    const errors = (data as { errors?: unknown }).errors;
    if (!errors || typeof errors !== 'object') return null;
    const normalized: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
        const fieldKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalized[fieldKey] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
}
