import { AxiosError } from 'axios';

export function formatApiError(err: unknown, fallback: string): string {
    if (err instanceof AxiosError) {
        const status = err.response?.status;
        const data = err.response?.data;
        const serverMessage = typeof data === 'string'
            ? data
            : (typeof data === 'object' && data && 'message' in data ? String((data as { message: unknown }).message) : '');

        if (status === 400 && serverMessage) return serverMessage;
        if (status === 401 || status === 403) return 'Not authorized.';
        if (status === 404) return serverMessage || 'Not found.';
        if (status === 409) return serverMessage || 'Conflict — already exists.';
        if (status === 502 || status === 503) return 'Vipps unreachable. Try again in a moment.';
        if (status === 429) return 'Too many requests. Wait a moment.';
        if (serverMessage) return serverMessage;
    }
    return fallback;
}
